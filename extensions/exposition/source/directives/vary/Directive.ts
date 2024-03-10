import type { Properties } from './Properties'
import type { Input } from '../../io'
import type { Parameter } from '../../RTD'

export interface Directive {
  preflight: (context: Input, properties: Properties, parameters: Parameter[]) => void
}
