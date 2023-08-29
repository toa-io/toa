import { type Node } from './Node'
import { type Directives } from './Directives'
import { type Method } from './Method'

export interface Match<IMethod extends Method, IDirectives extends Directives<IDirectives>> {
  node: Node<IMethod, IDirectives>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
