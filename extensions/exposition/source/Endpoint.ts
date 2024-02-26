import { type Component } from '@toa.io/core'
import { type Remotes } from './Remotes'
import { Mapping } from './Mapping'
import { type Context } from './Context'
import * as http from './HTTP'
import type * as RTD from './RTD'

export class Endpoint implements RTD.Endpoint<Endpoint> {
  private readonly endpoint: string
  private readonly mapping: Mapping
  private readonly discovery: Promise<Component>
  private remote: Component | null = null

  public constructor (endpoint: string, mapping: Mapping, discovery: Promise<Component>) {
    this.endpoint = endpoint
    this.mapping = mapping
    this.discovery = discovery
  }

  public async call
  (body: any, query: http.Query, parameters: RTD.Parameter[]): Promise<http.OutgoingMessage> {
    const request = this.mapping.fit(body, query, parameters)

    this.remote ??= await this.discovery

    const reply = await this.remote.invoke(this.endpoint, request)

    if (reply instanceof Error)
      throw new http.Conflict(reply)

    const message: http.OutgoingMessage = { body: reply }

    if (typeof reply === 'object' && reply !== null && '_version' in reply) {
      message.headers ??= new Headers()
      message.headers.set('etag', `"${reply._version.toString()}"`)
      delete reply._version
    }

    return message
  }

  public async close (): Promise<void> {
    this.remote ??= await this.discovery

    await this.remote.disconnect(INTERRUPT)
  }
}

export class EndpointsFactory implements RTD.EndpointsFactory<Endpoint> {
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

const INTERRUPT = true
