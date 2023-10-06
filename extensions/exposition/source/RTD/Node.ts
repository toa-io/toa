import { type Route } from './Route'
import { type Methods } from './Method'
import { type Match, type Parameter } from './Match'
import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export class Node<
  TEndpoint extends Endpoint<TEndpoint> = any,
  TDirectives extends Directives<TDirectives> = any
> {
  public intermediate: boolean
  public methods: Methods<TEndpoint, TDirectives>
  private readonly protected: boolean
  private routes: Route[]

  public constructor
  (routes: Route[], methods: Methods<TEndpoint, TDirectives>, properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.protected = properties.protected
    this.intermediate = this.routes.findIndex((route) => route.root) !== -1

    this.sort()
  }

  public match (fragments: string[], parameters: Parameter[] = []): Match | null {
    for (const route of this.routes) {
      const match = route.match(fragments, parameters)

      if (match !== null)
        return match
    }

    return null
  }

  public merge (node: Node<TEndpoint, TDirectives>): void {
    this.intermediate = node.intermediate

    if (!this.protected) this.replace(node)
    else this.append(node)

    this.sort()
  }

  private replace (node: Node<TEndpoint, TDirectives>): void {
    const methods = Object.values(this.methods)

    this.routes = node.routes
    this.methods = node.methods

    for (const method of methods)
      void method.close() // race condition is really unlikely
  }

  private append (node: Node<TEndpoint, TDirectives>): void {
    for (const route of node.routes)
      this.mergeRoute(route)

    for (const [verb, method] of Object.entries(node.methods))
      if (verb in this.methods)
        console.warn(`Overriding of the protected method ${verb} is not permitted.`)
      else
        this.methods[verb] = method
  }

  private mergeRoute (candidate: Route): void {
    for (const route of this.routes)
      if (candidate.equals(route)) {
        route.merge(candidate)

        return
      }

    this.routes.push(candidate)
  }

  private sort (): void {
    this.routes.sort((a, b) => a.variables - b.variables)
  }
}

export interface Properties {
  protected: boolean
}
