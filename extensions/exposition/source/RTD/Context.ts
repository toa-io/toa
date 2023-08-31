import { type Directives, type DirectivesFactory } from './Directives'
import { type Endpoint, type EndpointsFactory } from './Endpoint'

export interface Context<
  IEndpoint extends Endpoint = any,
  IDirective extends Directives<IDirective> = any,
  IExtension = any
> {
  readonly protected: boolean
  readonly endpoints: EndpointsFactory<IEndpoint>
  readonly directives: {
    readonly factory: DirectivesFactory
    stack: IDirective[]
  }
  readonly extension?: IExtension
}
