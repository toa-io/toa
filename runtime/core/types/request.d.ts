import { Exception } from './exception'

export interface Query {
  id?: string
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

export interface Request {
  input?: any
  query?: Query
  authentic?: boolean
  task?: boolean
}

export interface Reply {
  output?: any
  error?: object
  exception?: Exception
}
