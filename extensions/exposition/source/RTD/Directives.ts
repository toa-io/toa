import type { Parameter } from './Match.ts'
import type * as syntax from './syntax/index.ts'
import type { Context, OutgoingMessage, Options } from '../HTTP/index.ts'
import type { Output } from '../io.ts'
import type { Introspection } from '../Introspection.ts'
import type { extensions } from '@toa.io/core/types'

type Host = extensions.Host

export interface Directives {
  /**
   * The directives of one family on this method, or nothing where it declares none of it.
   * For a consumer of a declaration rather than of a stage: what a method is published as
   * is stated on the route, and read where the publishing happens.
   */
  declared: <T>(family: string) => T[] | undefined

  precall: (context: Context, parameters: Parameter[]) => Promise<Output>

  /**
   * Whether this caller is told of the method at all. Asked per request, which is the one
   * thing about a description that depends on who is asking.
   */
  admits: (context: Context) => Promise<boolean>

  /**
   * What this route's directives make of what its method says about itself. No caller: what
   * a family describes is what the route declares, so the answer is the same for everyone
   * who is admitted, and is built once.
   */
  describe: (introspection: Introspection) => Introspection | null
  settle: (context: Context, response: OutgoingMessage) => Promise<void>
  dispose: () => void
}

export interface DirectiveFactory {
  create: (directives: syntax.Directive[], route: string) => Directives

  /** Whether this declaration is carried into the nodes below the one it is on. */
  inheritable: (directive: syntax.Directive) => boolean

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

  /**
   * Whether a declaration applies to everything below the node it is on, as every directive
   * does unless it says otherwise. A family that describes what one node *is* sets this
   * `false`: inherited, it would say the same thing of every resource under it.
   */
  readonly inherited?: boolean

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
  precall?: (
    directives: TDirective[],
    request: Context & TExtension,
    parameters: Parameter[]
  ) => Output | Promise<Output>

  /**
   * Whether this caller is told of the method at all — `auth` alone has anything to say
   * here. A family that does not implement it admits everyone; `false` takes the method
   * out of every answer that describes it.
   *
   * Apart from `explain` because it is the one part of describing a method that depends on
   * the caller: what is described is then built once and answered to all of them.
   */
  admits?: (directives: TDirective[], request: Context & TExtension) => Promise<boolean>

  /**
   * What this family's directives make of what the method says about itself, which is
   * what `OPTIONS` answers and what a tool is described by. `null` hides it: the method is
   * described to nobody, whoever asks.
   *
   * There is no request here — no route variable has a value, no body has arrived, and no
   * caller is known — so a directive that can only tell from one hands back what it was
   * given.
   */
  explain?: (
    directives: TDirective[],
    introspection: Introspection
  ) => Introspection | null

  /** Call-scoped, on the message that call produced. */
  settle?: (
    directives: TDirective[],
    request: Context & TExtension,
    response: OutgoingMessage
  ) => void | Promise<void>

  /**
   * Request-scoped, on the message going back — the counterpart of `preflight`, and
   * likewise without directives. A reply the whole request carries, such as a re-issued
   * credential, is written here rather than by a call that would not own it.
   */
  depart?: (
    request: Context & TExtension,
    response: OutgoingMessage
  ) => void | Promise<void>

  dispose?: (directives: TDirective[]) => void
}
