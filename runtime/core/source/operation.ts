import { Readable, Transform, pipeline } from 'node:stream'
import { Connector } from './connector.ts'
import {
  codes,
  SystemException,
  RequestContractException,
  ResponseContractException
} from './exceptions.ts'
import * as parts from './parts.ts'
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
import type { Envelope, Query, Reply } from './types/request.ts'

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
  /**
   * Whether the same call arriving twice changes state once; see `documentation/inbox.md`. A
   * number is how many seconds a call is remembered, where the deployment's window is not the
   * one its callers retry within.
   */
  once?: boolean | number
  /** every call begins a chain of its own; see `documentation/cycles.md` */
  unchained?: boolean
}

export class Operation extends Connector {
  public scope: State

  /** whether every call begins a chain of its own, which `Component.invoke` reads */
  public readonly unchained: boolean

  /**
   * Whether the algorithm runs again where its write is lost, which `Component.invoke` reads.
   * Only a transition commits, so only a transition is.
   */
  public retried: boolean = false

  /**
   * Whether what this operation acquires may be modified and committed. Only a
   * transition commits, and only a commit needs the pre-image an entity keeps
   * to diff the new state against.
   *
   * @protected
   */
  protected mutable: boolean = false

  /** whether a query of this operation may name the properties its storage reads */
  protected projects: boolean = false

  readonly #cascade: Cascade
  readonly #contracts: Contracts
  readonly #query: Translator
  readonly #scope: Scope
  readonly #once: boolean

  /** what this operation states of how long a call is remembered; the deployment's where absent */
  readonly #retention: number | undefined

  /** a reply is validated only on local environments, which are set before an operation is built */
  readonly #local: boolean

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
    this.unchained = definition.unchained === true

    this.#cascade = cascade
    this.#contracts = contracts
    this.#query = query
    this.#scope = definition.scope
    this.#once = definition.once === true || typeof definition.once === 'number'
    this.#retention = typeof definition.once === 'number' ? definition.once : undefined
    this.#local = environment.get('TOA_ENV') === 'local'

    this.depends(cascade)
  }

  public async invoke(request: Envelope): Promise<any> {
    try {
      /*
       * A projection is what a storage reads, and only an observation's read is never written
       * back: a transition replaces the record it read, an assignment's event carries the record
       * it changed, and an effect reads for what it does next. Refused here rather than by the
       * contract alone, because an authentic request skips the contract.
       */
      if (!this.projects && (request.query as Query | undefined)?.projection !== undefined)
        throw new RequestContractException('`projection` is read by an observation alone')

      if (request.authentic !== true) this.#contracts.request.fit(request)

      // the request carries the query onward in its parsed form: what a storage is given,
      // not what the caller sent
      if ('query' in request)
        request.query = this.#query.parse(request.query as Query) as any

      // validate entity
      if ('entity' in request) this.scope.fit(request.entity)

      const store = { request }
      const reply = this.#once ? await this.once(store) : await this.process(store)

      return restrict(reply, request.output)
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
    const call: Call = { id: store.request.id, reply: { ...store.reply } }

    if (this.#retention !== undefined) call.retention = this.#retention

    return call
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

    if (reply?.error instanceof Error) reply.error = refusal(reply.error)

    if (this.#local && !(reply instanceof Readable))
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

/**
 * What travels of an error an algorithm returned: its message as the code, and its cause. Made
 * here rather than where it is sent, because a reply handed over in process is not serialised,
 * and a caller would read a different error from the same operation.
 */
function refusal(error: Error): NonNullable<Reply['error']> {
  if (error.message === '')
    throw new ResponseContractException(
      'an error is returned with its code as the message'
    )

  return error.cause === undefined
    ? { code: error.message }
    : { code: error.message, cause: error.cause }
}

/**
 * What a caller receives of the output it asked for: each object of it keeps the properties the
 * request named, in the order the object holds them, and an empty list leaves no output at all.
 * A system property is one of them: a caller that reads `VERSION` asks for it. An object is one
 * the output is, one of an array it is, or one a stream it is yields. An error, an exception and
 * a value that is not an object are answered as they are.
 */
function restrict(reply: any, output?: string[]): any {
  if (output === undefined || reply === null || typeof reply !== 'object') return reply

  // a stream is answered bare, where anything else is answered in `output`
  if (reply instanceof Readable) return restrict({ output: reply }, output).output ?? {}

  const answered = reply.output

  if (answered === undefined || answered === null) return reply

  if (output.length === 0) {
    // nobody reads it, and what it holds open — a cursor, a reply pipe — is let go now
    if (answered instanceof Readable) answered.destroy()

    delete reply.output

    return reply
  }

  if (typeof answered !== 'object') return reply

  const allowed = new Set(output)

  // a stream of bytes is a value, as a primitive is: there is no property of it to leave out
  if (answered instanceof Readable)
    reply.output = answered.readableObjectMode ? restricted(answered, allowed) : answered
  else if (Array.isArray(answered)) reply.output = answered.map((value) => fitted(value, allowed))
  else reply.output = fit(answered, allowed)

  return reply
}

/**
 * A stream of what `fitted` makes of each value. Joined by `pipeline`, so that a failure of
 * either side reaches the other: the source's error is the reader's, and a reader that stops
 * reading closes the source.
 */
function restricted(source: Readable, allowed: Set<string>): Readable {
  const transform = new Transform({
    objectMode: true,
    transform(value, _, callback) {
      callback(null, fitted(value, allowed))
    }
  })

  return pipeline(source, transform, noop)
}

function fitted(value: unknown, allowed: Set<string>): unknown {
  // what a part carries of the set is its entry; a removal and a token are not the entity's
  if (parts.is(value)) return 'entry' in value ? { entry: fit(value.entry, allowed) } : value

  return value !== null && typeof value === 'object' && !ArrayBuffer.isView(value)
    ? fit(value as Record<string, any>, allowed)
    : value
}

// what `pipeline` reports is what each stream already carries to its reader
function noop(): void {}

/** Runs per entity of a collection, hence the set and the absence of intermediates. */
function fit(entity: Record<string, any>, allowed: Set<string>): Record<string, any> {
  const output: Record<string, any> = {}

  // the entity's own keys, so that what is answered keeps the order it was built in
  for (const key of Object.keys(entity)) if (allowed.has(key)) output[key] = entity[key]

  return output
}

