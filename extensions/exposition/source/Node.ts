import { Route } from './Route'
import { segment } from './segment'
import * as syntax from './RTD/syntax'
import type { Segments } from './segment'

export class Node {
  public readonly intermediate: boolean
  public readonly methods: Methods
  private readonly routes: Route[]

  private constructor (routes: Route[], methods: Methods, intermediate: boolean) {
    this.routes = routes
    this.methods = methods
    this.intermediate = intermediate
  }

  public static create (definition: syntax.Node): Node {
    const routes: Route[] = []
    const methods: Methods = new Map()
    const intermediate = '/' in definition

    for (const [key, value] of Object.entries(definition))
      if (key[0] === '/') routes.push(createRoute(key, value))
      else if (syntax.methods.has(key as syntax.Method)) methods.set(key as syntax.Method, value)

    return new Node(routes, methods, intermediate)
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

type Methods = Map<syntax.Method, syntax.Mapping>
