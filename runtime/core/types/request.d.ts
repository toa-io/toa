import { Exception } from './exception.js'

/**
 * What a call asks for. `Entity` is the record it is about, which narrows the projection;
 * left out, any name is accepted.
 */
export interface Query<Entity = any> {
  id?: string
  ids?: Array<string>
  criteria?: string
  search?: string
  sample?: number
  omit?: number
  limit?: number
  sort?: Array<string>
  projection?: Array<string & keyof Entity>
  version?: number
  deleted?: boolean
}

/**
 * Origin of a call. Stamped by the caller, sanitized by the request contract.
 */
export type Source =
  | { namespace: string, component: string, operation: string }
  | { namespace: string, component: string, event: string }
  | { service: string }

export interface Request<Input = any, Entity = any> {
  input?: Input
  query?: Query<Entity>
  /** What the operation acquires, where the caller supplies it rather than the storage. */
  entity?: Entity
  authentic?: boolean
  task?: boolean
  telemetry?: string // W3C traceparent
  source?: Source
}

/**
 * An error an operation declares and returns. A call resolves to it rather than throwing:
 * only an exception is thrown.
 */
export interface RemoteError<Code extends string = string> extends Error {
  code: Code
}

export interface Reply {
  output?: any
  error?: object
  exception?: Exception
}
