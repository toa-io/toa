import { type Route } from './Route'
import { type Methods } from './Method'
import { type Parameter } from './Match'

export class Node<IMethod = any, IDirectives = any> {
  public intermediate: boolean
  public methods: Methods<IMethod>
  public directives: IDirectives
  private readonly protected: boolean
  private routes: Route[]

  // eslint-disable-next-line max-params
  public constructor (routes: Route[],
    methods: Methods<IMethod>,
    directives: IDirectives,
    properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.directives = directives
    this.protected = properties.protected
    this.intermediate = this.routes.findIndex((route) => route.root) !== -1

    this.sort()
  }

  public match (fragments: string[], parameters: Parameter[]): Node<IMethod> | null {
    for (const route of this.routes) {
      const node = route.match(fragments, parameters)

      if (node !== null) return node
    }

    return null
  }

  public merge (node: Node<IMethod>): void {
    this.intermediate = node.intermediate
    this.directives = node.directives

    if (!this.protected) this.replace(node)
    else this.append(node)
  }

  private replace (node: Node<IMethod>): void {
    this.routes = node.routes
    this.methods = node.methods

    this.sort()
  }

  private append (node: Node<IMethod>): void {
    for (const route of node.routes)
      this.mergeRoute(route)

    this.sort()

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
