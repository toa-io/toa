import type { Size } from './layout'
import type { Graph } from './graph'

export interface Props {
  graph: Graph
  /** The vertex the arrangement is built around. */
  id: string
  view: Size
}
