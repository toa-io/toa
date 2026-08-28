import type { Size } from './layout'
import type { Graph } from './graph'

export interface Props {
  graph: Graph
  view: Size
  /** A card was pressed: it becomes the one the map is about. */
  onselect: (id: string) => void
}
