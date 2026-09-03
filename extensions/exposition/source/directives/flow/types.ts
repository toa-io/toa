import type { Input as Context, Input, Output } from '../../io.js'
import type { Parameter } from '../../RTD/index.js'

export interface Directive {
  apply?: (input: Input, parameters: Parameter[]) => Promise<Output>
  attach?: (context: Context) => void
}
