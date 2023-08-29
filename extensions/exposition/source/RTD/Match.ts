import { type Node } from './Node'
import { type Directives } from './Directives'

export interface Match<IMethod, IDirectives extends Directives<IDirectives>> {
  node: Node<IMethod, IDirectives>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
