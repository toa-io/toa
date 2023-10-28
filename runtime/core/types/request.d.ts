import { Exception } from './exception'

export interface Query {
  id?: string
  criteria?: string
  omit?: number
  limit?: number
  sort?: Array<string>
  projection?: Array<string>
  version?: number
}

export interface Request {
  input?: any
  query?: Query
  authentic?: boolean
}

export interface Reply {
  output?: any
  error?: object
  exception?: Exception
}
