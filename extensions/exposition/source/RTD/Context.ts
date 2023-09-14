import { type Directives, type DirectivesFactory } from './Directives'
import { type Endpoint, type EndpointsFactory } from './Endpoint'

export interface Context<
  TEndpoint extends Endpoint = any,
  TDirectives extends Directives<TDirectives> = any,
  TExtension = any
> {
  readonly protected: boolean
  readonly endpoints: EndpointsFactory<TEndpoint>
  readonly directives: {
    readonly factory: DirectivesFactory
    stack: TDirectives[]
  }
  readonly extension?: TExtension
}
