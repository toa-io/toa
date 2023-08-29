import { type Context } from './Context'
import type * as syntax from './syntax'

export interface Method {
  close: () => Promise<void>
}

export type Methods<T extends Method> = Record<string, T>

export interface MethodFactory<T extends Method = any> {
  create: (method: syntax.Method, context: Context) => T
}
