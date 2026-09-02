import type { Input } from '../../io.js'

export interface Directive {
  preflight: (context: Input) => void
}
