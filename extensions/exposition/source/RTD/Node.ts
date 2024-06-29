import { type Route } from './Route'
import { type Methods } from './Method'
import { type Match, type Parameter } from './Match'

export class Node {
  public intermediate: boolean
  public forward: string | null
  public methods: Methods
  private readonly protected: boolean
  private routes: Route[]

  public constructor
  (routes: Route[], methods: Methods, properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.protected = properties.protected
    this.forward = properties.forward ?? null
    this.intermediate = this.routes.findIndex((route) => route.root) !== -1

    this.sort()
  }

  public match (fragments: string[], parameters: Parameter[] = []): Match | null {
    for (const route of this.routes) {
      const params = parameters.slice()
      const match = route.match(fragments, params)

      if (match !== null)
        return match
    }

    return null
  }

  public merge (node: Node): void {
    this.intermediate = node.intermediate

    if (this.protected)
      this.append(node)
    else
      this.replace(node)

    this.sort()
  }

  public async explain (parameters: Parameter[]): Promise<Record<string, unknown>> {
    const methods: Record<string, unknown> = {}

    const explained = Object.entries(this.methods)
      .map(async ([verb, method]) =>
        (methods[verb] = await method.explain(parameters)))

    await Promise.all(explained)

    return methods
  }

  private replace (node: Node): void {
    const methods = Object.values(this.methods)

    this.routes = node.routes
    this.methods = node.methods

    // race condition is really unlikely
    for (const method of methods)
      void method.close()
  }

  private append (node: Node): void {
    for (const route of node.routes)
      this.route(route)

    for (const [verb, method] of Object.entries(node.methods))
      this.methods[verb] = method
  }

  private route (candidate: Route): void {
    for (const route of this.routes)
      if (candidate.equals(route)) {
        route.merge(candidate)

        return
      }

    this.routes.push(candidate)
  }

  private sort (): void {
    this.routes.sort((a, b) => {
      return a.variables === b.variables
        ? b.segments.length - a.segments.length // routes with more segments should be matched first
        : a.variables - b.variables // routes with more variables should be matched last
    })
  }
}

export interface Properties {
  protected: boolean
  forward?: string
}
