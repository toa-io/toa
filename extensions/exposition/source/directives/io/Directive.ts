import type { Sync } from './lib/throttle/index.ts'
import type { Parameter } from '../../RTD/index.ts'
import type { Input as Context } from '../../io.ts'
import type * as http from '../../HTTP/index.ts'

export interface Directive {
  precall: (context: Context, parameters: Parameter[]) => void

  /** Synchronous by contract: settling holds the response, and none of it needs I/O. */
  settle?: (context: Context, response: http.OutgoingMessage) => void
}

export interface Constructor {
  validate: (value: unknown) => void

  new (value: any, sync: Sync, route: string): Directive
}
