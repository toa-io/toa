import { type Node } from './Node'

export interface Match<TMethod> {
  node: Node<TMethod>
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
