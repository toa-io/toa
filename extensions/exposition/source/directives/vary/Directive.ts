import type { Properties } from './Properties'
import type { Input } from '../../io'

export interface Directive {
  preflight: (request: Input, properties: Properties) => void
}
