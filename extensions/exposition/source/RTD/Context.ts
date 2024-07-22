import { type DirectiveFactory } from './Directives'
import { type EndpointsFactory } from './Endpoint'
import type { Directive } from './syntax'

export interface Context<TExtension = any> {
  readonly protected: boolean
  readonly endpoints: EndpointsFactory
  readonly directives: {
    readonly factory: DirectiveFactory
    stack: Directive[]
  }
  readonly extension: TExtension
}
