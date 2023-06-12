import type { Node } from './Node'
import type { Segments } from './segment'

export class Route {
  private readonly segments: Segments
  private readonly node: Node

  public constructor (segments: Segments, node: Node) {
    this.segments = segments
    this.node = node
  }

  public match (segments: Segments): Node | null {
    for (let i = 0; i < this.segments?.length; i++)
      if (this.segments[i] !== null && this.segments[i] !== segments[i])
        return null

    if (this.segments.length === segments.length && !this.node.intermediate) return this.node
    else return this.matchNested(segments)
  }

  private matchNested (segments: Segments): Node | null {
    const slice = segments.slice(this.segments.length)

    return this.node.match(slice)
  }
}
