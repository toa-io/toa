import { type Input, type Output } from '../../Directive'

export interface Directive {
  apply: (input: Input) => Output
}
