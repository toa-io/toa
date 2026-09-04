import type { Parameter } from './Match.js'
import type * as syntax from './syntax/index.js'
import type { Context, OutgoingMessage, Options } from '../HTTP/index.js'
import type { Output } from '../io.js'
import type { extensions } from '@toa.io/core'

type Host = extensions.Host

export interface Directives {
  precall: (context: Context, parameters: Parameter[]) => Promise<Output>
  settle: (context: Context, response: OutgoingMessage) => Promise<void>
  dispose: () => void
}

export interface DirectiveFactory {
  create: (directives: syntax.Directive[], route: string) => Directives

  /** Runs every family's `preflight`, which is request-scoped and needs no node. */
  preflight: (context: Context) => Promise<void>

  /** Runs every family's `depart`, the counterpart of `preflight`. */
  depart: (context: Context, response: OutgoingMessage) => Promise<void>

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

  /**
   * Request-scoped, before anything is routed. It takes no directives: no node is known
   * yet, and a request that carries several calls has no single node at all. What a
   * directive declares is call-scoped by definition, so only what a family does on its
   * own behalf — authenticating a credential — belongs here. It answers nothing: a stage
   * that runs before a route is known has no reply to make, and refuses by throwing.
   */
  preflight?: (request: Context & TExtension) => void | Promise<void>

  /** Call-scoped, with what the node declares. Runs once per call. */
  precall?: (directives: TDirective[],
    request: Context & TExtension,
    parameters: Parameter[]) => Output | Promise<Output>

  /** Call-scoped, on the message that call produced. */
  settle?: (directives: TDirective[],
    request: Context & TExtension,
    response: OutgoingMessage) => void | Promise<void>

  /**
   * Request-scoped, on the message going back — the counterpart of `preflight`, and
   * likewise without directives. A reply the whole request carries, such as a re-issued
   * credential, is written here rather than by a call that would not own it.
   */
  depart?: (request: Context & TExtension,
    response: OutgoingMessage) => void | Promise<void>

  dispose?: (directives: TDirective[]) => void
}
