import { type Input } from '../../Directive'

export interface Directive<T = unknown> {
  value: T
  apply: (input: Input) => void
}
