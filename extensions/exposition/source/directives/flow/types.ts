import type { Input as Context, Input, Output } from '../../io.ts'
import type { Parameter } from '../../RTD/index.ts'

export interface Directive {
  apply?: (input: Input, parameters: Parameter[]) => Promise<Output>
  attach?: (context: Context) => void
}
