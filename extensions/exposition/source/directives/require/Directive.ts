import type { Input } from '../../io'

export interface Directive {
  preflight: (context: Input) => void
}
