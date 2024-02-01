import { type Input } from '../../Directive'

export interface Directive<T = never> {
  value: T
  apply: (input: Input) => void
}
