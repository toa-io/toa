import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

/** Everything the card shows; the document's own bookkeeping is not part of it. */
type NodeLike = Omit<Node, 'id' | '_created' | '_updated' | '_version' | '_deleted'>

export interface Props {
  node: NodeLike
  /** Opened from the outside where the card is the point of the screen, as on the map. */
  open?: boolean
  class?: ClassValue
}

export type { NodeLike }
