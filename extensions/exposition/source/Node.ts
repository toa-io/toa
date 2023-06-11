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
    const routes: Route[] = []

    for (const [key, value] of Object.entries(definition))
      routes.push(createRoute(key, value))

    return new Node(routes)
  }

  public match (segments: Segments): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }
}

function createRoute (key: string, value: syntax.Node): Route {
  const segments = segment(key)
  const node = Node.create(value)

  return new Route(segments, node)
}
