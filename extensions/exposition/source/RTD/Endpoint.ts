import { type Context } from './Context.js'
import type * as http from '../HTTP/index.js'
import type * as syntax from './syntax/index.js'
import type * as RTD from './index.js'
import type { Introspection, Schema } from '../Introspection.js'

export interface Endpoint {
  call: (
    context: http.Context,
    parameters: RTD.Parameter[]
  ) => Promise<http.OutgoingMessage>

  explain: (parameters: RTD.Parameter[]) => Promise<Introspection>

  /**
   * What picks the records a call is about — `criteria`, `sort` and the rest. Not part of
   * what the resource says about itself: it is the same of every queryable one. A
   * procedure carries it, because there it is something the caller sends.
   */
  selection: () => Record<string, Schema> | null

  close: () => Promise<void>
}

export interface EndpointsFactory {
  create: (method: syntax.Method, context: Context) => Endpoint
}
