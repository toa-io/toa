import { type Input, type Output } from '../../Directives'

export interface Directive {
  apply: (input: Input) => Output
}
