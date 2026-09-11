import { type Context } from './Context.ts'
import type * as http from '../HTTP/index.ts'
import type * as syntax from './syntax/index.ts'
import type * as RTD from './index.ts'
import type { Introspection, Schema } from '../Introspection.ts'

export interface Endpoint {
  call: (
    context: http.Context,
    parameters: RTD.Parameter[]
  ) => Promise<http.OutgoingMessage>

  explain: (parameters: RTD.Parameter[]) => Promise<Introspection>

  /**
   * What picks the records a call is about — `criteria`, `sort` and the rest. Stated as
   * `selection` on the method, because it is not a parameter the resource declares.
   */
  selection: () => Record<string, Schema> | null

  close: () => Promise<void>
}

export interface EndpointsFactory {
  create: (method: syntax.Method, context: Context) => Endpoint
}
