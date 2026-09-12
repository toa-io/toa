import { type Route } from './Route.ts'
import { type Method, type Methods } from './Method.ts'
import { type Match, type Parameter } from './Match.ts'
import type { Segment } from './segment.ts'
import type { Context } from '../HTTP/index.ts'
import { guarded, resource, type Described } from '../directives/help/index.ts'
import type { Introspection } from '../Introspection.ts'

export class Node {
  public intermediate: boolean
  public forward: string | null
  public expiration: number
  public methods: Methods

  private readonly protected: boolean
  private routes: Route[]

  public constructor(routes: Route[], methods: Methods, properties: Properties) {
    this.routes = routes
    this.methods = methods
    this.protected = properties.protected
    this.forward = properties.forward ?? null
    this.expiration = properties.expiration ?? Infinity
    this.intermediate = this.routes.findIndex((route) => route.root) !== -1

    this.sort()
  }

  public match(
    fragments: string[],
    parameters: Parameter[] = [],
    segments: Segment[] = []
  ): Match | null {
    // a route only pushes, so what a failed one added is cut off rather than the array copied
    const mark = parameters.length
    const pieces = segments.length

    for (const route of this.routes) {
      const match = route.match(fragments, parameters, segments)

      if (match !== null) return match

      parameters.length = mark
      segments.length = pieces
    }

    return null
  }

  /**
   * Returns the nodes the merged branch has landed on, so that its expiration
   * can later be extended without rebuilding anything.
   */
  public merge(node: Node): Node[] {
    this.intermediate = node.intermediate

    const nodes = this.protected ? this.append(node) : this.replace(node)

    this.sort()

    return nodes
  }

  public touch(expiration: number): void {
    if (!this.protected) this.expiration = expiration
  }

  /**
   * Every method under this node, with the template it answers at.
   *
   * An intermediate node is skipped: it is never what a path matches, because its `/` route
   * answers at the same place and is reached instead. The trunk is the exception `match`
   * makes for it — `'/'` answers the trunk itself, whatever it holds.
   */
  public *walk(segments: Segment[], trunk = false): Generator<Mount> {
    if (trunk || !this.intermediate)
      for (const [verb, method] of Object.entries(this.methods))
        yield { segments, verb, method }

    for (const route of this.routes) yield* route.walk(segments)
  }

  /**
   * What this resource is, and every method of it this caller may reach, in the order they
   * were declared. The two are answered apart because only the methods are `Allow`.
   */
  public async explain(context: Context, parameters: Parameter[]): Promise<Explained> {
    const entries = Object.entries(this.methods)

    const explained = await Promise.all(
      entries.map(async ([, method]) => await method.explain(context, parameters))
    )

    const methods: Record<string, Introspection> = {}

    for (let i = 0; i < entries.length; i++)
      if (explained[i] !== null) methods[entries[i][0]] = explained[i]!

    // every method of a node carries the same declaration, so the first that is there says it
    const stated = entries.length === 0 ? null : resource(entries[0][1].directives)
    const described = { ...stated, ...guarded(methods) }

    return {
      described: Object.keys(described).length === 0 ? null : described,
      methods
    }
  }

  private replace(node: Node): Node[] {
    const methods = Object.values(this.methods)

    this.routes = node.routes
    this.methods = node.methods
    this.expiration = node.expiration
    this.forward = node.forward

    // race condition is really unlikely
    for (const method of methods) void method.close()

    return this.nodes()
  }

  private append(node: Node): Node[] {
    const nodes: Node[] = []

    for (const route of node.routes) nodes.push(...this.route(route))

    for (const [verb, method] of Object.entries(node.methods)) this.methods[verb] = method

    return nodes
  }

  private route(candidate: Route): Node[] {
    for (const route of this.routes)
      if (candidate.equals(route)) return route.merge(candidate)

    this.routes.push(candidate)

    return candidate.node.nodes()
  }

  private nodes(): Node[] {
    const nodes: Node[] = [this]

    for (const route of this.routes) nodes.push(...route.node.nodes())

    return nodes
  }

  private sort(): void {
    this.routes.sort((a, b) => {
      return a.variables === b.variables
        ? b.segments.length - a.segments.length // routes with more segments should be matched first
        : a.variables - b.variables // routes with more variables should be matched last
    })
  }
}

/** What a resource says of itself, and what it serves. */
export interface Explained {
  described: Described | null
  methods: Record<string, Introspection>
}

/** A method, and the route template it is reached by. */
export interface Mount {
  segments: Segment[]
  verb: string
  method: Method
}

export interface Properties {
  protected: boolean
  forward?: string
  expiration?: number
}
