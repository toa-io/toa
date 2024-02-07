import type { Properties } from '../Properties'
import type { Input } from '../../../io'

export interface Embedding {
  resolve: (input: Input, properties: Properties) => string | undefined
}
