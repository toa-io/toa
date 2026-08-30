import type { Parameter } from '../../../../../RTD'
import type { Input as Context } from '../../../../../io'

export interface Component {
  get: (context: Context, parameters: Parameter[]) => string
}
