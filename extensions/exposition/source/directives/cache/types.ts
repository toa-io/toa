import { type Output, type Input } from '../../Directive'

export interface Directive {
  preProcess?: (input: Input) => Output
  postProcess?: (input: Input, output: Output) => Headers
}
