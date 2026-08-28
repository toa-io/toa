import type { ClassValue } from 'svelte/elements'
import type { NodeLike } from '../Node'

export interface Props {
  node: NodeLike
  open?: boolean
  /**
   * Given where the card can be opened, and then it carries a chevron. The card does not
   * open itself: on the map only one neighbour is open at a time, and that is not a thing
   * a card can know.
   */
  ontoggle?: () => void
  class?: ClassValue
}
