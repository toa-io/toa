import type { Input } from '../../io.js'

export interface Directive {
  precall: (context: Input) => void
}
