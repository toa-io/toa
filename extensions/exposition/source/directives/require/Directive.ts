import type { Input } from '../../io.ts'

export interface Directive {
  precall: (context: Input) => void
}
