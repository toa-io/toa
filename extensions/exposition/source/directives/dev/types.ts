import type { Input, Output } from '../../io.ts'

export interface Directive {
  apply: (input: Input) => Promise<Output> | Output
}
