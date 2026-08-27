import { Exception } from './exception'

export interface Query {
  id?: string
  ids?: Array<string>
  criteria?: string
  search?: string
  sample?: number
  omit?: number
  limit?: number
  sort?: Array<string>
  projection?: Array<string>
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

export interface Request {
  input?: any
  query?: Query
  authentic?: boolean
  task?: boolean
  telemetry?: string // W3C traceparent
  source?: Source
}

export interface Reply {
  output?: any
  error?: object
  exception?: Exception
}
