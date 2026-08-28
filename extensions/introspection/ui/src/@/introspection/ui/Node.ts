import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/introspection'

/** Everything the card shows; the document's own bookkeeping is not part of it. */
type NodeLike = Omit<Node, 'id' | '_created' | '_updated' | '_version' | '_deleted'>

export interface Props {
  node: NodeLike
  /** Opened from the outside where the card is the point of the screen, as on the map. */
  open?: boolean
  /**
   * Whether it folds at all. A card that is the whole of what a screen is about has
   * nowhere to fold to, and a chevron on it only invites the reader to make it useless.
   */
  collapsible?: boolean
  class?: ClassValue
}

export type { NodeLike }
