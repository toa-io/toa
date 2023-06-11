import type { Route } from './Route'

export class Node {
  private readonly routes: Route[]

  public constructor (routes: Route[] = []) {
    this.routes = routes
  }

  public match (segments: string[]): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }
}
