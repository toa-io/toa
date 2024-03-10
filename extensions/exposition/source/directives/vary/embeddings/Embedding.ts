import type { Properties } from '../Properties'
import type { Input } from '../../../io'
import type { Parameter } from '../../../RTD'

export interface Embedding {
  resolve: (input: Input, properties: Properties, parameters: Parameter[]) => string | undefined
}
