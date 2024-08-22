import type { Input as Context, Input, Output } from '../../io'
import type { Parameter } from '../../RTD'

export interface Directive {
  apply?: (input: Input, parameters: Parameter[]) => Promise<Output>
  attach?: (context: Context) => void
}
