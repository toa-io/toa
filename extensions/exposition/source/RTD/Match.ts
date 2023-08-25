import { type Node } from './Node'

export interface Match<IMethod, IDirectives> {
  node: Node<IMethod, IDirectives>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
