import { type Segment } from './segment.js'
import { type Match, type Parameter } from './Match.js'
import type { Mount, Node } from './Node.js'

export class Route {
  public readonly root: boolean
  public readonly variables: number = 0
  public readonly segments: Segment[]
  public readonly node: Node
  private readonly wildcard: boolean = false

  public constructor (segments: Segment[], node: Node) {
    this.root = segments.length === 0
    this.segments = segments
    this.node = node

    for (const segment of segments)
      if (segment.fragment === null) {
        this.variables++
        this.wildcard ||= segment.wildcard === true
      }
  }

  public match (fragments: string[], parameters: Parameter[]): Match | null {
    if (Date.now() >= this.node.expiration)
      return null

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]

      if (segment.fragment !== null && segment.fragment !== fragments[i])
        return null

      if (segment.fragment === null && segment.placeholder !== null)
        parameters.push({ name: segment.placeholder, value: decode(fragments[i]) })

      if (segment.fragment === null && segment.wildcard === true)
        parameters.push({
          name: '**',
          value: fragments.slice(this.segments.length - 1).map(decode).join('/')
        })
    }

    const exact = this.segments.length === fragments.length

    if ((exact && !this.node.intermediate) || this.wildcard)
      return { node: this.node, parameters }
    else
      return this.matchNested(fragments, parameters)
  }

  public * walk (prefix: Segment[]): Generator<Mount> {
    // an expired branch is not matched, so nothing under it is reachable to name
    if (Date.now() >= this.node.expiration)
      return

    yield * this.node.walk(prefix.concat(this.segments))
  }

  public equals (route: Route): boolean {
    if (route.segments.length !== this.segments.length)
      return false

    for (let i = 0; i < this.segments.length; i++)
      if (this.segments[i].fragment !== route.segments[i].fragment)
        return false

    return true
  }

  public merge (route: Route): Node[] {
    return this.node.merge(route.node)
  }

  private matchNested (fragments: string[], parameters: Parameter[]): Match | null {
    fragments = fragments.slice(this.segments.length)

    return this.node.match(fragments, parameters)
  }
}

/**
 * What the segment says, rather than how it was written: a value is percent-encoded to
 * survive the path, and an operation reads what a caller meant — a `client_id` that is a
 * URL arrives as one. A literal segment is matched as written, which is how it is declared.
 *
 * An escape that decodes to nothing valid is left as it stands; refusing the route over it
 * would answer `404` to a request whose only fault is its spelling.
 */
function decode (fragment: string): string {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}
