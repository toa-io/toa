import { type Directives, type DirectivesFactory } from './Directives'
import { type EndpointsFactory } from './Endpoint'

export interface Context<
  TDirectives extends Directives<TDirectives> = any,
  TExtension = any
> {
  readonly protected: boolean
  readonly endpoints: EndpointsFactory
  readonly directives: {
    readonly factory: DirectivesFactory
    stack: TDirectives[]
  }
  readonly extension?: TExtension
}
