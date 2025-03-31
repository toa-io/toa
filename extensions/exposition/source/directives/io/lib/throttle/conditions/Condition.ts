import type { Input, Output } from '../../../../../io'

export interface Condition {
  match: (input: Input, output: Output) => boolean
}
