import { type Component, type Reply } from '@toa.io/core'
import { type Context, type MethodFactory, type Parameter, type syntax } from './RTD'
import { type Remotes } from './Remotes'
import { Mapping } from './Mapping'
import { type Branch } from './Branch'
import type * as http from './HTTP'

export class Endpoint {
  private readonly endpoint: string
  private readonly mapping: Mapping
  private readonly discovery: Promise<Component>
  private remote: Component | null = null

  public constructor (endpoint: string, mapping: Mapping, discovery: Promise<Component>) {
    this.endpoint = endpoint
    this.mapping = mapping
    this.discovery = discovery
  }

  public async call (body: any, query: http.Query, parameters: Parameter[]): Promise<Reply> {
    const request = this.mapping.fit(body, query, parameters)

    this.remote ??= await this.discovery

    return await this.remote.invoke(this.endpoint, request)
  }
}

export class EndpointFactory implements MethodFactory<Endpoint> {
  private readonly remotes: Remotes

  public constructor (remotes: Remotes) {
    this.remotes = remotes
  }

  public create (method: syntax.Method, context: Context<Branch>): Endpoint {
    const mapping = Mapping.create(method.verb, method.mapping.query)
    const namespace = method.mapping.namespace ?? context.extensions?.namespace
    const component = method.mapping.component ?? context.extensions?.component

    if (namespace === undefined || component === undefined)
      throw new Error('Annotation methods must contain namespace and component properties.')

    const discovery = this.remotes.discover(namespace, component)

    return new Endpoint(method.mapping.endpoint, mapping, discovery)
  }
}
