import { type Context } from './Context'
import type * as http from '../HTTP'
import type * as syntax from './syntax'
import type * as RTD from './index'

export interface Endpoint {
  call: (context: http.Context, parameters: RTD.Parameter[]) => Promise<http.OutgoingMessage>

  explain: () => unknown

  close: () => Promise<void>
}

export interface EndpointsFactory {
  create: (method: syntax.Method, context: Context) => Endpoint
}
