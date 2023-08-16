import { Exception } from './exception'

export interface Reply {
  output?: Object
  error?: Object
  exception?: Exception
}
