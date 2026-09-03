import type { Parameter } from './Match.js'
import type * as syntax from './syntax/index.js'
import type { Context, OutgoingMessage, Options } from '../HTTP/index.js'
import type { Output } from '../io.js'
import type { extensions } from '@toa.io/core'

type Host = extensions.Host

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
   * Called once per gateway with what the host provides and how the gateway is configured,
   * before any directive is created.
   */
  mount?: (host: Host, options: Options) => void

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
