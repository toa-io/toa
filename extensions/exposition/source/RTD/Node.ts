import type * as syntax from './syntax'
import type { Route } from './Route'
import type { Method, Methods } from './Method'
import type { Segments } from './segment'

export class Node {
  public readonly intermediate: boolean
  public readonly methods: Methods
  private readonly protected: boolean
  private readonly routes: Route[]

  public constructor (routes: Route[], methods: Methods, properties: Properties) {
    this.intermediate = properties.intermediate
    this.protected = properties.protected
    this.routes = routes
    this.methods = methods
  }

  public match (segments: Segments): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }

  public merge (node: Node): void {
    for (const route of node.routes)
      this.mergeRoute(route)

    for (const [verb, method] of node.methods)
      this.mergeMethod(verb, method)
  }

  private mergeRoute (candidate: Route): void {
    for (const route of this.routes)
      if (candidate.equals(route)) {
        route.merge(candidate)

        return
      }

    this.routes.push(candidate)
  }

  private mergeMethod (verb: syntax.Method, method: Method): void {
    if (this.methods.has(verb) && this.protected)
      return

    this.methods.set(verb, method)
  }
}

export interface Properties {
  intermediate: boolean
  protected: boolean
}
