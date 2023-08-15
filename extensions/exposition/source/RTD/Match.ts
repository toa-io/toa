import { type Node } from './Node'

export interface Match {
  node: Node
  params: Record<string, string>
}
