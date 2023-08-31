import { type Route } from './Route'
import { type Methods } from './Method'
import { type Parameter } from './Match'
import { type Directives } from './Directives'
import { type Endpoint } from './Endpoint'

export class Node<
  IEndpoint extends Endpoint<IEndpoint> = any,
  IDirectives extends Directives<IDirectives> = any
> {
  public intermediate: boolean
  public methods: Methods<IEndpoint, IDirectives>
  private readonly protected: boolean
  private routes: Route[]

  public constructor
  (routes: Route[], methods: Methods<IEndpoint, IDirectives>, properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.protected = properties.protected
    this.intermediate = this.routes.findIndex((route) => route.root) !== -1

    this.sort()
  }

  public match (fragments: string[], parameters: Parameter[]): Node<IEndpoint, IDirectives> | null {
    for (const route of this.routes) {
      const node = route.match(fragments, parameters)

      if (node !== null)
        return node
    }

    return null
  }

  public merge (node: Node<IEndpoint, IDirectives>): void {
    this.intermediate = node.intermediate

    if (!this.protected) this.replace(node)
    else this.append(node)

    this.sort()
  }

  private replace (node: Node<IEndpoint, IDirectives>): void {
    const methods = Object.values(this.methods)

    this.routes = node.routes
    this.methods = node.methods

    for (const method of methods)
      void method.close() // race condition is really unlikely
  }

  private append (node: Node<IEndpoint, IDirectives>): void {
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
