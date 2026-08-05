import { Readable } from 'node:stream'
import { createHash } from 'node:crypto'
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

    const endpoint = this.remote.locator.id + '.' + this.endpoint

    console.debug('Calling operation', { endpoint, request })

    const reply = await this.remote.invoke(this.endpoint, request)

    console.debug('Received reply', { endpoint, reply: reply instanceof Readable ? '[Readable stream]' : reply })

    if (reply instanceof Error)
      throw new http.UnprocessableEntity(reply)

    const message: http.OutgoingMessage = {}

    // etag
    if (reply !== null && reply !== undefined) {
      const etag = context.request.headers['if-none-match']

      if (this.conditionalGet(reply, etag, message))
        return message
    }

    // last-modified
    if (typeof reply === 'object' && reply !== null && ('_updated' in reply || '_created' in reply)) {
      const timestamp: string = reply._updated ?? reply._created
      const date = new Date(timestamp)

      message.headers ??= new Headers()
      message.headers.set('last-modified', date.toUTCString())
    }

    message.body = reply

    return message
  }

  public async explain (parameters: RTD.Parameter[]): Promise<Introspection> {
    this.remote ??= await this.discovery

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

  private conditionalGet (reply: unknown, etag: string | undefined, message: http.OutgoingMessage): boolean {
    message.headers ??= new Headers()

    if (typeof reply === 'object' && reply !== null && '_version' in reply) {
      const matched = etag === undefined ? null : this.matchVersion(etag)

      if (etag !== undefined && matched !== null && reply._version === matched) {
        message.status = 304
        message.headers.set('etag', etag)

        return true
      }

      message.headers.set('etag', `"${reply._version.toString()}"`)

      return false
    }

    if (reply instanceof Readable)
      return false

    const hash = `"${createHash('sha256').update(JSON.stringify(reply)).digest('hex')}"`

    if (etag === hash) {
      message.status = 304
      message.headers.set('etag', etag)

      return true
    }

    message.headers.set('etag', hash)

    return false
  }

  private query (context: http.Context): http.Query {
    const query: http.Query = Object.fromEntries(context.url.searchParams)
    const etag = context.request.headers['if-match']

    if (etag !== undefined && this.mapping.queryable)
      query.version = this.version(etag)

    return query
  }

  private matchVersion (etag: string): number | null {
    const match = etag.match(ETAG)

    if (match === null)
      return null

    return Number.parseInt(match.groups!.version)
  }

  private version (etag: string): number {
    const version = this.matchVersion(etag)

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
    const namespace = method.mapping.namespace ?? context.extension.namespace
    const component = method.mapping.component ?? context.extension.component

    if (namespace === undefined || component === undefined)
      throw new Error('Annotation endpoints must be fully qualified')

    const discovery = this.remotes.discover(namespace, component, context.extension.version)

    return new Endpoint(method.mapping.endpoint, mapping, discovery)
  }
}

const ETAG = /^(W\/)?"(?<version>\d{1,32})"$/

const INTERRUPT = true
