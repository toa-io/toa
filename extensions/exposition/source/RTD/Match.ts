import { type Node } from './Node'

export interface Match {
  node: Node
  parameters: Parameter[]
}

export interface Parameter {
  name: string
  value: string
}
