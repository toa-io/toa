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
    return createNode(definition)
  }

  public match (segments: Segments): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }
}

function createNode (definition: syntax.Node): Node {
  const routes = []

  for (const [key, value] of Object.entries(definition))
    routes.push(createRoute(value, key))

  return new Node(routes)
}

function createRoute (value: syntax.Node, key: string): Route {
  const node = Node.create(value)
  const segments = segment(key)

  return new Route(segments, node)
}
