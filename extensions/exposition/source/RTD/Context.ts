import { type DirectiveFactory } from './Directives.ts'
import { type EndpointsFactory } from './Endpoint.ts'
import type { Directive } from './syntax/index.ts'

export interface Context<TExtension = any> {
  readonly protected: boolean
  readonly endpoints: EndpointsFactory
  readonly directives: {
    readonly factory: DirectiveFactory
    stack: Directive[]
  }

  /** The route being built, accumulated on the way down and restored on the way up. */
  path: string
  readonly extension: TExtension
}
