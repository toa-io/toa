import { type Parameter } from './Match'
import type { Route } from './Route'
import type { Methods } from './Method'

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

  public match (fragments: string[], parameters: Parameter[]): Node | null {
    for (const route of this.routes) {
      const node = route.match(fragments, parameters)

      if (node !== null) return node
    }

    return null
  }

  public merge (node: Node): void {
    for (const route of node.routes)
      this.route(route)

    for (const [verb, method] of node.methods)
      if (!(this.protected || this.methods.has(verb)))
        this.methods.set(verb, method)
  }

  private route (candidate: Route): void {
    for (const route of this.routes)
      if (candidate.equals(route)) {
        route.merge(candidate)

        return
      }

    this.routes.push(candidate)
  }
}

export interface Properties {
  intermediate: boolean
  protected: boolean
}
