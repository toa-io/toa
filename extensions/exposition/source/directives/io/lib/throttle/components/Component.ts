import type { Input as Context } from '../../../../../io'

export interface Component {
  get: (context: Context) => string
}
