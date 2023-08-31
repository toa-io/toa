import { type Node } from './Node'
import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export interface Match<
  IEndpoint extends Endpoint<IEndpoint> = any,
  IDirectives extends Directives<IDirectives> = any
> {
  node: Node<IEndpoint, IDirectives>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
