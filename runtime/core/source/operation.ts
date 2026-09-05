import { Readable } from 'node:stream'
import { Connector } from './connector.js'
import { SystemException, RequestContractException } from './exceptions.js'
import type { Cascade } from './cascade.js'
import type { State } from './state.js'
import type { Query as Translator } from './query.js'
import type { Contract } from './contract/contract.js'
import type { Entity } from './entities/entity.js'
import type { EntitySet } from './entities/set.js'
import type { Changeset } from './entities/changeset.js'
import type { scope as Scope } from './types/operations.js'
import type { Query, Request } from './types/request.js'

/** What an operation acquires for the algorithm to run against. */
export type Scoped = Entity | EntitySet | Changeset | Readable | null

/** What one invocation carries from step to step. */
export interface Store {
  request: Request
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

  // eslint-disable-next-line max-params
  public constructor (cascade: Cascade, scope: State, contracts: Contracts,
    query: Translator, definition: Definition) {
    super()

    this.scope = scope

    this.#cascade = cascade
    this.#contracts = contracts
    this.#query = query
    this.#scope = definition.scope

    this.depends(cascade)
  }

  public async invoke (request: Request): Promise<any> {
    try {
      if (request.authentic !== true)
        this.#contracts.request.fit(request)

      // the request carries the query onward in its parsed form: what a storage is given,
      // not what the caller sent
      if ('query' in request)
        request.query = this.#query.parse(request.query as Query) as any

      // validate entity
      if ('entity' in request)
        this.scope.fit(request.entity)

      const store = { request }

      return await this.process(store)
    } catch (e) {
      const exception = e instanceof Error ? new SystemException(e) : e

      return { exception }
    }
  }

  protected async process (store: Store): Promise<any> {
    await this.acquire(store)
    await this.run(store)
    await this.commit(store)

    return store.reply
  }

  protected async acquire (store: Store): Promise<void> {
    if (this.#scope === 'none')
      return

    const scope = await this.query(store.request.query)
    const raw = scope === null || scope instanceof Readable

    store.scope = scope
    store.state = raw ? scope : (scope as Entity).get()
  }

  protected async run (store: Store): Promise<void> {
    const { request, state } = store
    const reply = await this.#cascade.run(request.input, state)

    // validate reply only on local environments
    if (process.env.TOA_ENV === 'local' && !(reply instanceof Readable))
      this.#contracts.reply.fit(reply)

    store.reply = reply
  }

  protected async commit (_store: Store): Promise<void> {}

  protected async query (query?: Query): Promise<Scoped> {
    if (query === undefined)
      throw new RequestContractException('Request query is required')

    const acquire = this.scope[this.#scope] as
      (query: Query, mutable?: boolean) => Promise<Scoped>

    return acquire.call(this.scope, query, this.mutable)
  }
}
