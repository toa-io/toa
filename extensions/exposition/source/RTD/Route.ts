import { type Node } from './Node'
import { type Segment } from './segment'
import { type Parameter } from './Match'

export class Route {
  private readonly segments: Segment[]
  private readonly node: Node

  public constructor (segments: Segment[], node: Node) {
    this.segments = segments
    this.node = node
  }

  public match (fragments: string[], parameters: Parameter[]): Node | null {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]

      if (segment.fragment !== null && segment.fragment !== fragments[i])
        return null

      if (segment.fragment === null)
        parameters.push({ name: segment.placeholder, value: fragments[0] })
    }

    const exact = this.segments.length === fragments.length

    if (exact && !this.node.intermediate) return this.node
    else return this.matchNested(fragments, parameters)
  }

  public equals (route: Route): boolean {
    if (route.segments.length !== this.segments.length) return false

    for (let i = 0; i < this.segments.length; i++)
      if (this.segments[i].fragment !== route.segments[i].fragment) return false

    return true
  }

  public merge (route: Route): void {
    this.node.merge(route.node)
  }

  private matchNested (fragments: string[], parameters: Parameter[]): Node | null {
    const slice = fragments.slice(this.segments.length)

    return this.node.match(slice, parameters)
  }
}
