import type { Parameter } from './Match'
import type * as syntax from './syntax'
import type { Context, OutgoingMessage } from '../HTTP'
import type { Output } from '../io'

export interface Directives {
  preflight: (context: Context, parameters: Parameter[]) => Promise<Output>
  settle: (context: Context, response: OutgoingMessage) => Promise<void>
  dispose: () => void
}

export interface DirectiveFactory {
  create: (directives: syntax.Directive[], route: string) => Directives
  dispose: () => void
}

export interface DirectiveSet {
  family: DirectiveFamily
  directives: any[]

  /** qualified directive names, e.g. `auth:id` */
  names?: string[]
}

export interface DirectiveFamily<TDirective = any, TExtension = any> {
  readonly name: string
  readonly mandatory: boolean

  create: (name: string, ...rest: any[]) => TDirective

  /**
   * Puts the directives of one route in the order they must run in. Called once, when
   * the set is built — the order cannot depend on the request.
   */
  arrange?: (directives: TDirective[]) => void

  preflight?: (directives: TDirective[],
    request: Context & TExtension,
    parameters: Parameter[]) => Output | Promise<Output>

  settle?: (directives: TDirective[],
    request: Context & TExtension,
    response: OutgoingMessage) => void | Promise<void>

  dispose?: (directives: TDirective[]) => void
}
