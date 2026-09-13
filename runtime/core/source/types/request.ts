import type { Exception } from '../exceptions.ts'

/**
 * What a call asks for. `Entity` is the record it is about, which narrows the projection;
 * left out, any name is accepted.
 */
export interface Query<Entity = any> {
  id?: string
  ids?: string[]
  criteria?: string
  search?: string
  sample?: number
  omit?: number
  limit?: number
  sort?: string[]
  projection?: Array<string & keyof Entity>
  version?: number
  deleted?: boolean
}

/** Origin of a call. Stamped by the framework; whoever reads it takes the keys it knows. */
export type Source =
  | { namespace: string; component: string; operation: string }
  | { namespace: string; component: string; event: string }
  | { service: string }

/**
 * What a caller asks for, and what a caller may say about it — the identity of the call, where the
 * caller has one to give, and whatever of the envelope whoever hands it over already knows. A
 * receiver stamps the identity and the chain off the message the call came from.
 */
export interface Request<Input = any, Entity = any> {
  input?: Input
  query?: Query<Entity>
  /** What the operation acquires, where the caller supplies it rather than the storage. */
  entity?: Entity
  task?: boolean
  /**
   * The process a call to a stateful operation goes to: that process's `context.instance`. Named
   * for a stateful operation, and for no other.
   */
  instance?: string
  /**
   * What this call is, so that the same call arriving twice is written once. Left out, the caller
   * stamps one: derived from the call it is itself serving, where there is one, and minted where
   * there is not. See `core/source/entities/newid.ts` and the inbox.
   */
  id?: string
  source?: Source
  /**
   * The hops this call passed through, oldest first. Stamped by the framework; a call that has
   * been where it is going already is refused rather than made. See `core/source/trail.ts`.
   */
  trail?: string[]
  /**
   * The properties of the output this caller receives, of each object the operation answers. An
   * empty list receives none of it, and a request that names none receives the output whole.
   */
  output?: string[]
  /**
   * Whether this caller reads an output encoded rather than as values: a gateway writing it as a
   * response body spends nothing on reading it. What answers one encodes it once.
   */
  encoded?: boolean
  /**
   * Whether this call, and every call made under it, may reach only a safe operation. Stamped by
   * the framework and carried down the chain; set and never cleared, so a call made under one is
   * readonly whatever it says of itself. See `core/source/safety.ts`.
   */
  readonly?: boolean
  /** the sender validated against the contract, so the recipient does not */
  authentic?: boolean
  /** W3C traceparent */
  telemetry?: string
}

/**
 * How a caller waits for a call, given beside the request: neither is part of what the call asks,
 * and neither is sent with it.
 */
export interface Options {
  /**
   * Milliseconds the caller waits for the reply. An addressed call waits the context's default
   * without one; an ordinary call waits for as long as it takes.
   */
  timeout?: number
  /** Ends the wait when it aborts, within the timeout. */
  signal?: AbortSignal
}

/**
 * What an operation receives: the request, in the envelope the framework put it in. The one
 * difference from what a caller may hand over is that the identity is settled, which is why an
 * operation may rely on it and a caller need not supply it.
 *
 * The envelope is the framework's own object rather than the caller's written over, because a
 * caller may hand one object to several calls — `id` alone makes that fatal, as two calls cannot
 * share an identity — and because what a caller wrote and what the runtime added are then two
 * things rather than one.
 */
export interface Envelope<Input = any, Entity = any> extends Request<Input, Entity> {
  id: string
}

/**
 * An error an operation declares and returns. A call resolves to it rather than throwing:
 * only an exception is thrown.
 */
export interface RemoteError<Code extends string = string> extends Error {
  code: Code
}

/** What an operation returns where it may refuse: the value, or the error it refused with. */
export type Maybe<T> = T | Error

export interface Reply {
  output?: any
  error?: object
  exception?: Exception
}
