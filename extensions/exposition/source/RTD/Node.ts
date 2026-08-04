import { type Route } from './Route'
import { type Methods } from './Method'
import { type Match, type Parameter } from './Match'

export class Node {
  public intermediate: boolean
  public forward: string | null
  public expiration: number
  public methods: Methods
  private readonly protected: boolean
  private routes: Route[]

  public constructor (routes: Route[], methods: Methods, properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.protected = properties.protected
    this.forward = properties.forward ?? null
    this.expiration = properties.expiration ?? Infinity
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

  /**
   * Returns the nodes the merged branch has landed on, so that its expiration
   * can later be extended without rebuilding anything.
   */
  public merge (node: Node): Node[] {
    this.intermediate = node.intermediate

    const nodes = this.protected ? this.append(node) : this.replace(node)

    this.sort()

    return nodes
  }

  public touch (expiration: number): void {
    if (this.protected)
      return

    this.expiration = expiration

    for (const route of this.routes)
      route.node.touch(expiration)
  }

  public async explain (parameters: Parameter[]): Promise<Record<string, unknown>> {
    const methods: Record<string, unknown> = {}

    const explained = Object.entries(this.methods)
      .map(async ([verb, method]) =>
        (methods[verb] = await method.explain(parameters)))

    await Promise.all(explained)

    return methods
  }

  private replace (node: Node): Node[] {
    const methods = Object.values(this.methods)

    this.routes = node.routes
    this.methods = node.methods
    this.expiration = node.expiration
    this.forward = node.forward

    // race condition is really unlikely
    for (const method of methods)
      void method.close()

    return [this]
  }

  private append (node: Node): Node[] {
    const nodes: Node[] = []

    for (const route of node.routes)
      nodes.push(...this.route(route))

    for (const [verb, method] of Object.entries(node.methods))
      this.methods[verb] = method

    return nodes
  }

  private route (candidate: Route): Node[] {
    for (const route of this.routes)
      if (candidate.equals(route))
        return route.merge(candidate)

    this.routes.push(candidate)

    return [candidate.node]
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
  expiration?: number
}
