import type { Input as Context } from '../../io'
import type * as http from '../../HTTP'

export interface Directive {
  preflight: (context: Context) => void
  settle?: (context: Context, response: http.OutgoingMessage) => Promise<void> | void
  dispose?: () => void
}

export interface Constructor {
  validate: (value: unknown) => void

  new (value: any): Directive
}
