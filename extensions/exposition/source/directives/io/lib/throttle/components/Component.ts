import type { Parameter } from '../../../../../RTD/index.js'
import type { Input as Context } from '../../../../../io.js'

export interface Component {
  /** what to key on, or nothing when the request cannot be keyed by this component */
  get: (context: Context, parameters: Parameter[]) => string | undefined
}
