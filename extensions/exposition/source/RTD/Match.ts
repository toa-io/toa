import { type Node } from './Node'
import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export interface Match<
  TEndpoint extends Endpoint<TEndpoint> = any,
  TDirectives extends Directives<TDirectives> = any
> {
  node: Node<TEndpoint, TDirectives>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
