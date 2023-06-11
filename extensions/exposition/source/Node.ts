import { Route } from './Route'
import { segment } from './segment'
import type { Segments } from './segment'
import type * as syntax from './RTD/syntax'

export class Node {
  private readonly routes: Route[]

  public constructor (routes: Route[] = []) {
    this.routes = routes
  }

  public static create (definition: syntax.Node): Node {
    return create(definition)
  }

  public match (segments: Segments): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }
}

function create (definition: syntax.Node): Node {
  const routes = []

  for (const [key, value] of Object.entries(definition)) {
    const node = Node.create(value)
    const segments = segment(key)
    const route = new Route(segments, node)

    routes.push(route)
  }

  return new Node(routes)
}
