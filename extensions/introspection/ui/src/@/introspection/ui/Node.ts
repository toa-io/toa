import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

/** Everything the card shows; the document's own bookkeeping is not part of it. */
type NodeLike = Omit<Node, 'id' | '_created' | '_updated' | '_version' | '_deleted'>

export interface Props {
  node: NodeLike
  class?: ClassValue
}

export type { NodeLike }
