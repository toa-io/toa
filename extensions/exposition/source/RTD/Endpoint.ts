import { type Context } from './Context'
import type * as syntax from './syntax'

export interface Endpoint<T extends Endpoint = any> {
  call: T['call']
  close: () => Promise<void>
}

export interface EndpointsFactory<T extends Endpoint<T> = any> {
  create: (method: syntax.Method, context: Context) => T
}
