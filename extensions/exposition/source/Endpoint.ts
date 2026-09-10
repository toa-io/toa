import { Readable } from 'node:stream'
import { entities } from '@toa.io/core'
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

  public constructor(endpoint: string, mapping: Mapping, discovery: Promise<Remote>) {
    this.endpoint = endpoint
    this.mapping = mapping
    this.discovery = discovery
  }

  public async call(
    context: http.Context & Authenticated,
    parameters: RTD.Parameter[]
  ): Promise<http.OutgoingMessage> {
    const body = await context.body()
    const query = this.query(context)
    const request = this.mapping.fit(body, query, parameters)
    // a header sent twice is an ambiguity, not a key; the client repeats one value or none
    const key = context.request.headers[IDEMPOTENCY_KEY]

    if (typeof key === 'string' && key !== '') request.id = identity(context, key)

    this.remote ??= await this.discovery

    const reply = await this.remote.invoke(this.endpoint, request)

    if (reply instanceof Error) throw new http.UnprocessableEntity(reply)

    const message: http.OutgoingMessage = { body: reply }

    // what the reply carries for a cache to validate by; the `cache` family sets the headers
    if (typeof reply === 'object' && reply !== null && !(reply instanceof Readable)) {
      if ('VERSION' in reply) message.version = reply.VERSION

      const modified = reply.UPDATED ?? reply.CREATED

      if (modified !== undefined) message.modified = modified
    }

    return message
  }

  public selection(): Record<string, Schema> | null {
    return this.mapping.selection()
  }

  public async explain(parameters: RTD.Parameter[]): Promise<Introspection> {
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
  private async introspect(parameters: RTD.Parameter[]): Promise<Introspection> {
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

      if (schema === undefined) continue

      route ??= {}
      route[parameter.name] = schema
    }

    const query = this.mapping.explain(operation)
    const selection = this.mapping.selection()
    const introspection: Introspection = {}

    if (route !== null) introspection.route = route

    if (query !== null) introspection.query = query

    if (selection !== null) introspection.selection = selection

    Object.assign(introspection, operation)

    return introspection
  }

  public async close(): Promise<void> {
    this.remote ??= await this.discovery

    await this.remote.disconnect(INTERRUPT)
  }

  private query(context: http.Context): http.Query {
    const query: http.Query = Object.fromEntries(context.url.searchParams)
    const etag = context.request.headers['if-match']

    if (etag !== undefined && this.mapping.queryable) query.version = this.version(etag)

    return query
  }

  private version(etag: string): number {
    const version = parse(etag)

    if (version === null) throw new http.BadRequest('Invalid ETag')

    return version
  }
}

export class EndpointsFactory implements RTD.EndpointsFactory {
  private readonly remotes: Remotes

  public constructor(remotes: Remotes) {
    this.remotes = remotes
  }

  public create(method: RTD.syntax.Method, context: Context): Endpoint {
    if (method.mapping === undefined)
      throw new Error('Cannot create Endpoint without mapping')

    const mapping = Mapping.create(method.mapping.query, method.mapping.paged)

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

/**
 * What a client's idempotency key names, as an identity the runtime can hold: it is what the
 * operation records the call under, so a retry under the same key is the same call.
 *
 * Four things, and each of them earns its place. The **principal**, because two clients that
 * both pick `1` would otherwise be answered with each other's replies — and worse, either could
 * suppress the other's write by getting there first. The **key** itself, which is what the
 * client repeats. The **method** and the **path**, because one key sent to two routes is two
 * calls: the path carries the record the call is about, so a key reused across orders does not
 * collapse them into one.
 *
 * Not the payload. A client that sends one key with two different bodies is answered with what
 * the first one answered, which is what an idempotency key means; telling them off for it costs
 * a stored fingerprint and buys a diagnostic.
 *
 * Hashed rather than taken as it is, so that a key is opaque input: a client cannot name an
 * identity the runtime would have minted, and cannot reach one another client's key derives.
 */
function identity(context: http.Context & Authenticated, key: string): string {
  return entities.derive(
    context.identity?.id ?? ANONYMOUS,
    key,
    context.request.method,
    context.url.pathname
  )
}

/**
 * A route nothing authenticates has no principal to scope a key by, so every client of one
 * shares a namespace. Keys are still honoured there — the alternative is refusing a header the
 * client is entitled to send — and what it costs is that two anonymous clients picking one key
 * on one path collide. Anonymous routes that change state are the case to watch.
 */
const ANONYMOUS = ''

const IDEMPOTENCY_KEY = 'idempotency-key'

/**
 * What the auth family leaves on the context, as much of it as this reads. Declared here rather
 * than imported, the way `cache` declares its own: the property is that family's.
 */
interface Authenticated {
  identity?: { id: string } | null
}
