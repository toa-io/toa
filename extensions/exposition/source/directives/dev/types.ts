import type { Input, Output } from '../../io.js'

export interface Directive {
  apply: (input: Input) => Promise<Output> | Output
}
