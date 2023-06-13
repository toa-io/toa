import { type Segments } from './segment'
import { type Route } from './Route'
import { type Methods } from './Method'

export class Node {
  public readonly intermediate: boolean
  public readonly methods: Methods
  private readonly routes: Route[]

  public constructor (routes: Route[], methods: Methods, intermediate: boolean) {
    this.routes = routes
    this.methods = methods
    this.intermediate = intermediate
  }

  public match (segments: Segments): Node | null {
    for (const route of this.routes) {
      const node = route.match(segments)

      if (node !== null) return node
    }

    return null
  }
}
