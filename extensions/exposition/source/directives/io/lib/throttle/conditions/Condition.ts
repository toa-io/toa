import type { Input, Output } from '../../../../../io.ts'

export interface Condition {
  match: (input: Input, output: Output) => boolean
}
