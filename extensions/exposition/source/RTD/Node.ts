import { type Segments } from './segment'
import { type Route } from './Route'
import { type Methods } from './Method'

export class Node {
  public readonly methods: Methods
  private routes: Route[]

  public constructor (routes: Route[], methods: Methods) {
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
    this.routes.push(...node.routes)
  }

  public replace (node: Node): void {
    this.routes = node.routes
  }
}

export class IntermediateNode extends Node {
  public constructor (routes: Route[]) {
    const methods: Methods = new Map()

    super(routes, methods)
  }
}
