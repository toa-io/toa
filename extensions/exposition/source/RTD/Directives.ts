import type { Parameter } from './Match'
import type * as syntax from './syntax'
import type { Context, OutgoingMessage } from '../HTTP'
import type { Output } from '../io'

export interface Directives {
  preflight: (context: Context, parameters: Parameter[]) => Promise<Output>
  settle: (context: Context, response: OutgoingMessage) => Promise<void>
}

export interface DirectiveFactory {
  create: (directives: syntax.Directive[]) => Directives
}

export interface DirectiveSet {
  family: DirectiveFamily
  directives: any[]
}

export interface DirectiveFamily<TDirective = any, TExtension = any> {
  readonly name: string
  readonly mandatory: boolean

  create: (name: string, ...rest: any[]) => TDirective

  preflight?: (directives: TDirective[],
    request: Context & TExtension,
    parameters: Parameter[]) => Output | Promise<Output>

  settle?: (directives: TDirective[],
    request: Context & TExtension,
    response: OutgoingMessage) => void | Promise<void>
}
