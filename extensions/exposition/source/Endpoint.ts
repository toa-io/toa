import { console } from 'openspan'
import { Mapping } from './Mapping'
import * as http from './HTTP'
import type { Introspection, Schema } from './Introspection'
import type { Remote } from '@toa.io/core'
import type { Remotes } from './Remotes'
import type { Context } from './Context'
import type * as RTD from './RTD'

export class Endpoint implements RTD.Endpoint {
  private readonly endpoint: string
  private readonly mapping: Mapping
  private readonly discovery: Promise<Remote>
  private remote: Remote | null = null

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

    if (context.debug)
      console.debug('Calling operation', {
        endpoint: this.remote.locator.id + '.' + this.endpoint,
        request
      })

    const reply = await this.remote.invoke(this.endpoint, request)

    if (reply instanceof Error)
      throw new http.UnprocessableEntity(reply)

    const message: http.OutgoingMessage = {}

    if (typeof reply === 'object' && reply !== null && '_version' in reply) {
      const etag = context.request.headers['if-none-match']

      message.headers ??= new Headers()

      if (etag !== undefined && reply._version === this.version(etag)) {
        message.status = 304
        message.headers.set('etag', etag)

        return message
      } else
        message.headers.set('etag', `"${reply._version.toString()}"`)
    }

    message.body = reply

    return message
  }

  public async explain (parameters: RTD.Parameter[]): Promise<Introspection> {
    this.remote ??= await this.discovery

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const operation = await this.remote.explain(this.endpoint)

    let route: Record<string, Schema> | null = null

    if (operation.input?.type === 'object')
      for (const parameter of parameters) {
        const schema = operation.input.properties[parameter.name]

        // eslint-disable-next-line max-depth
        if (schema !== undefined) {
          route ??= {}
          route[parameter.name] = schema

          delete operation.input.properties[parameter.name]
        }
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

    if (etag !== undefined)
      query.version = this.version(etag)

    return query
  }

  private version (etag: string): number {
    const match = etag.match(ETAG)

    if (match === null)
      throw new http.BadRequest('Invalid ETag.')

    return Number.parseInt(match.groups!.version)
  }
}

export class EndpointsFactory implements RTD.EndpointsFactory {
  private readonly remotes: Remotes

  public constructor (remotes: Remotes) {
    this.remotes = remotes
  }

  public create (method: RTD.syntax.Method, context: Context): Endpoint {
    if (method.mapping === undefined)
      throw new Error('Cannot create Endpoint without mapping.')

    const mapping = Mapping.create(method.mapping.query)
    const namespace = method.mapping.namespace ?? context.extension?.namespace
    const component = method.mapping.component ?? context.extension?.component

    if (namespace === undefined || component === undefined)
      throw new Error('Annotation endpoints must be fully qualified.')

    const discovery = this.remotes.discover(namespace, component)

    return new Endpoint(method.mapping.endpoint, mapping, discovery)
  }
}

const ETAG = /^"(?<version>\d{1,32})"$/

const INTERRUPT = true
