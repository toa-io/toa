import { Readable } from 'node:stream'
import { Mapping } from './Mapping.js'
import { take } from './Introspection.js'
import { parse } from './directives/cache/etag.js'
import * as http from './HTTP/index.js'
import type { Introspection, Schema } from './Introspection.js'
import type { Remote } from '@toa.io/core'
import type { Remotes } from './Remotes.js'
import type { Context } from './Context.js'
import type * as RTD from './RTD/index.js'

export class Endpoint implements RTD.Endpoint {
  private readonly endpoint: string
  private readonly mapping: Mapping
  private readonly discovery: Promise<Remote>
  private remote: Remote | null = null

  /** What the operation says, with what the route takes already split out of it. */
  private introspection: Introspection | null = null

  public constructor (endpoint: string, mapping: Mapping, discovery: Promise<Remote>) {
    this.endpoint = endpoint
    this.mapping = mapping
    this.discovery = discovery
  }

  public async call (context: http.Context, parameters: RTD.Parameter[]): Promise<http.OutgoingMessage> {
    const body = await context.body()
    const query = this.query(context)
    const request = this.mapping.fit(body, query, parameters)

    this.remote ??= await this.discovery

    const reply = await this.remote.invoke(this.endpoint, request)

    if (reply instanceof Error)
      throw new http.UnprocessableEntity(reply)

    const message: http.OutgoingMessage = { body: reply }

    // what the reply carries for a cache to validate by; the `cache` family sets the headers
    if (typeof reply === 'object' && reply !== null && !(reply instanceof Readable)) {
      if ('VERSION' in reply)
        message.version = reply.VERSION

      const modified = reply.UPDATED ?? reply.CREATED

      if (modified !== undefined)
        message.modified = modified
    }

    return message
  }

  public async explain (parameters: RTD.Parameter[]): Promise<Introspection> {
    this.introspection ??= await this.introspect(parameters)

    // what a directive narrows is this caller's answer, not the next caller's
    return structuredClone(this.introspection)
  }

  /**
   * `Remote.explain` answers the contract's own object, whose `input` is the manifest's by
   * reference. What follows takes properties out of it, and two routes mounting one endpoint
   * share one remote — so the copy is what keeps the second from describing what the first
   * took away.
   */
  private async introspect (parameters: RTD.Parameter[]): Promise<Introspection> {
    this.remote ??= await this.discovery

    const operation = structuredClone(await this.remote.explain(this.endpoint))

    // what the operation states it is, is the Introspection's to read and not a resource's:
    // an operation is written without knowledge of any route, and the same one mounted twice
    // is two methods. What a method states is what its route states, which `mcp:tool` gives.
    delete operation.description

    let route: Record<string, Schema> | null = null

    // a variable the operation names is taken by the path, so it is not the body's to send
    for (const parameter of parameters) {
      const schema = take(operation, parameter.name)

      if (schema === undefined)
        continue

      route ??= {}
      route[parameter.name] = schema
    }

    const query = this.mapping.explain(operation)
    const introspection: Introspection = {}

    if (route !== null)
      introspection.route = route

    if (query !== null)
      introspection.query = query

    Object.assign(introspection, operation)

    return introspection
  }

  public async close (): Promise<void> {
    this.remote ??= await this.discovery

    await this.remote.disconnect(INTERRUPT)
  }

  private query (context: http.Context): http.Query {
    const query: http.Query = Object.fromEntries(context.url.searchParams)
    const etag = context.request.headers['if-match']

    if (etag !== undefined && this.mapping.queryable)
      query.version = this.version(etag)

    return query
  }

  private version (etag: string): number {
    const version = parse(etag)

    if (version === null)
      throw new http.BadRequest('Invalid ETag')

    return version
  }
}

export class EndpointsFactory implements RTD.EndpointsFactory {
  private readonly remotes: Remotes

  public constructor (remotes: Remotes) {
    this.remotes = remotes
  }

  public create (method: RTD.syntax.Method, context: Context): Endpoint {
    if (method.mapping === undefined)
      throw new Error('Cannot create Endpoint without mapping')

    const mapping = Mapping.create(method.mapping.query)

    const branch = context.extension

    const namespace = method.mapping.namespace ?? branch?.namespace
    const component = method.mapping.component ?? branch?.component

    if (namespace === undefined || component === undefined)
      throw new Error('Annotation endpoints must be fully qualified')

    const discovery = this.remotes.discover(namespace, component, branch?.version)

    return new Endpoint(method.mapping.endpoint, mapping, discovery)
  }
}

const INTERRUPT = true
