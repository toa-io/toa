import { type Context } from './Context'
import type * as syntax from './syntax'

export interface DirectiveFactory<T = any> {
  create: (method: syntax.Directive, context: Context) => T
}
