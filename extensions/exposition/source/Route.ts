import type { Node } from './Node'

export class Route {
  private readonly segments: string[]
  private readonly node: Node

  public constructor (segments: string[], node: Node) {
    this.segments = segments
    this.node = node
  }

  public match (segments: string[]): Node | null {
    for (let i = 0; i < this.segments?.length; i++)
      if (this.segments[i] !== segments[i])
        return null

    if (this.segments.length === segments.length) return this.node
    else return this.nested(segments)
  }

  private nested (segments: string[]): Node | null {
    const slice = segments.slice(this.segments.length)

    return this.node.match(slice)
  }
}
