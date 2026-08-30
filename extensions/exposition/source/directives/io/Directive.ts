import type { Remote } from '@toa.io/core'
import type { Parameter } from '../../RTD'
import type { Input as Context } from '../../io'
import type * as http from '../../HTTP'

export interface Directive {
  preflight: (context: Context, parameters: Parameter[]) => void
  settle?: (context: Context, response: http.OutgoingMessage) => Promise<void> | void
  dispose?: () => void
}

export interface Constructor {
  validate: (value: unknown) => void

  new (value: any, counter: Promise<Remote>, route: string): Directive
}
