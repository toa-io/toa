import type { Exception } from '../exceptions.js'

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

export interface Request<Input = any, Entity = any> {
  input?: Input
  query?: Query<Entity>
  /** What the operation acquires, where the caller supplies it rather than the storage. */
  entity?: Entity
  authentic?: boolean
  task?: boolean
  /** W3C traceparent */
  telemetry?: string
  source?: Source
  /**
   * The hops this call passed through, oldest first. Stamped by the framework; a call that has
   * been where it is going already is refused rather than made. See `core/source/trail.ts`.
   */
  trail?: string[]
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
