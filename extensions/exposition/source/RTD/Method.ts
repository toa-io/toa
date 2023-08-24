import { type Context } from './Context'
import type * as syntax from './syntax'

export type Methods<T> = Record<string, T>

export interface MethodFactory<T = any> {
  create: (method: syntax.Method, context: Context) => T
}
