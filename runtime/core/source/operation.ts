import { Readable } from 'node:stream'
import { Connector } from './connector.ts'
import { codes, SystemException, RequestContractException } from './exceptions.ts'
import { environment } from '@toa.io/generic'
import type { Cascade } from './cascade.ts'
import type { State } from './state.ts'
import type { Query as Translator } from './query.ts'
import type { Contract } from './contract/contract.ts'
import type { Entity } from './entities/entity.ts'
import type { EntitySet } from './entities/set.ts'
import type { Changeset } from './entities/changeset.ts'
import type { scope as Scope } from './types/operations.ts'
import type { Call } from './types/inbox.ts'
import type { Envelope, Query } from './types/request.ts'

/** What an operation acquires for the algorithm to run against. */
export type Scoped = Entity | EntitySet | Changeset | Readable | null

/** What one invocation carries from step to step. */
export interface Store {
  request: Envelope
  scope?: Scoped
  state?: any
  reply?: any
  /** set by a transition, which is the only operation that runs its steps again */
  retry?: () => Promise<any>
}

export interface Contracts {
  request: Contract
  reply: Contract
}

export interface Definition {
  scope: Scope
  concurrency?: string
  /** whether the same call arriving twice changes state once; see `documentation/inbox.md` */
  once?: boolean
}

export class Operation extends Connector {
  public scope: State

  /**
   * Whether what this operation acquires may be modified and committed. Only a
   * transition commits, and only a commit needs the pre-image an entity keeps
   * to diff the new state against.
   *
   * @protected
   */
  protected mutable: boolean = false

  readonly #cascade: Cascade
  readonly #contracts: Contracts
  readonly #query: Translator
  readonly #scope: Scope
  readonly #once: boolean

  // eslint-disable-next-line max-params
  public constructor(
    cascade: Cascade,
    scope: State,
    contracts: Contracts,
    query: Translator,
    definition: Definition
  ) {
    super()

    this.scope = scope

    this.#cascade = cascade
    this.#contracts = contracts
    this.#query = query
    this.#scope = definition.scope
    this.#once = definition.once === true

    this.depends(cascade)
  }

  public async invoke(request: Envelope): Promise<any> {
    try {
      if (request.authentic !== true) this.#contracts.request.fit(request)

      // the request carries the query onward in its parsed form: what a storage is given,
      // not what the caller sent
      if ('query' in request)
        request.query = this.#query.parse(request.query as Query) as any

      // validate entity
      if ('entity' in request) this.scope.fit(request.entity)

      const store = { request }

      if (this.#once) return await this.once(store)

      return await this.process(store)
    } catch (e) {
      const exception = e instanceof Error ? new SystemException(e) : e

      return { exception }
    }
  }

  /**
   * The call, once. What it answered is recorded with what it changed, in one transaction, so a
   * second arrival of the same identity finds the key taken, changes nothing, and is answered
   * with what the first one answered.
   *
   * The read in front of it is not what makes that true — the key is — but it is what keeps the
   * ordinary duplicate from running the algorithm at all, and the ordinary duplicate is a
   * retransmission that arrives after the first call has finished.
   */
  protected async once(store: Store): Promise<any> {
    const { id } = store.request

    if (id === undefined)
      throw new RequestContractException(
        'a request to an operation declared `once` carries no id'
      )

    const recalled = await this.scope.recall(id)

    if (recalled !== null) return recalled

    try {
      return await this.process(store)
    } catch (exception) {
      if ((exception as { code?: number })?.code !== codes.DuplicateCall) throw exception

      /*
       * It was made between the read and the write — a duplicate that arrived while the first
       * was still running, and lost. Nothing of this one was committed, so what is answered is
       * the other one's reply. Absent only if the record expired in between, which is the
       * window closing on a call nobody is waiting on any more.
       */
      return (await this.scope.recall(id)) ?? { exception }
    }
  }

  /**
   * What is recorded with the write. Read where the write is made, which is after the algorithm
   * has run, because the reply is what a duplicate is answered with.
   */
  protected call(store: Store): Call | undefined {
    if (!this.#once) return undefined

    /*
     * A copy: an assignment fills its output in after the write it is recorded by returns, and
     * what is recorded must be what was known when the record was made rather than whatever the
     * reply became afterwards.
     */
    return { id: store.request.id, reply: { ...store.reply } }
  }

  protected async process(store: Store): Promise<any> {
    await this.acquire(store)
    await this.run(store)
    await this.commit(store)

    return store.reply
  }

  protected async acquire(store: Store): Promise<void> {
    if (this.#scope === 'none') return

    const scope = await this.query(store.request.query)
    const raw = scope === null || scope instanceof Readable

    store.scope = scope
    store.state = raw ? scope : (scope as Entity).get()
  }

  protected async run(store: Store): Promise<void> {
    const { request, state } = store
    const reply = await this.#cascade.run(request.input, state)

    // validate reply only on local environments
    if (environment.get('TOA_ENV') === 'local' && !(reply instanceof Readable))
      this.#contracts.reply.fit(reply)

    store.reply = reply
  }

  protected async commit(_store: Store): Promise<void> {}

  protected async query(query?: Query): Promise<Scoped> {
    if (query === undefined)
      throw new RequestContractException('Request query is required')

    const acquire = this.scope[this.#scope] as (
      query: Query,
      mutable?: boolean
    ) => Promise<Scoped>

    return acquire.call(this.scope, query, this.mutable)
  }
}
