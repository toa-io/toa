import { type bindings, Connector } from '@toa.io/core'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import type { Interception } from './Interception'
import type { Method, Parameter, Tree } from './RTD'
import type { Label } from './discovery'
import type { Branch } from './Branch'
import type { Endpoint } from './Endpoint'
import type { Directives } from './Directive'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree<Endpoint, Directives>
  private readonly interceptor: Interception

  // eslint-disable-next-line max-len
  public constructor (broadcast: Broadcast, tree: Tree<Endpoint, Directives>, interception: Interception) {
    super()

    this.broadcast = broadcast
    this.tree = tree
    this.interceptor = interception

    this.depends(broadcast)
  }

  public async process (context: http.Context): Promise<http.OutgoingMessage> {
    const interception = await context.timing.capture('gate:intercept',
      this.interceptor.intercept(context))

    if (interception !== null)
      return interception

    const match = this.tree.match(context.url.pathname)

    if (match === null)
      throw new http.NotFound()

    const {
      node,
      parameters
    } = match

    if (!(context.request.method in node.methods))
      throw new http.MethodNotAllowed()

    const method = node.methods[context.request.method]

    const interruption = await context.timing.capture('gate:preflight',
      method.directives.preflight(context, parameters))

    const response = interruption ??
      await context.timing.capture('gate:call', this.call(method, context, parameters))

    await context.timing.capture('gate:settle', method.directives.settle(context, response))

    return response
  }

  protected override async open (): Promise<void> {
    await this.discover()

    console.info('Gateway has started and is awaiting resource branches.')
  }

  protected override dispose (): void {
    console.info('Gateway is closed.')
  }

  private async call
  (method: Method<Endpoint, Directives>, context: http.Context, parameters: Parameter[]):
  Promise<http.OutgoingMessage> {
    if (context.url.pathname[context.url.pathname.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required.')

    if (context.encoder === null)
      throw new http.NotAcceptable()

    if (method.endpoint === null)
      throw new http.MethodNotAllowed()

    const body = await context.body()
    const query = this.query(context)

    return await method.endpoint
      .call(body, query, parameters)
      .catch(rethrow) as http.OutgoingMessage
  }

  private query (context: http.Context): http.Query {
    const query: http.Query = Object.fromEntries(context.url.searchParams)
    const etag = context.request.headers['if-match']

    if (etag !== undefined) {
      const match = etag.match(ETAG)

      if (match !== null)
        query.version = parseInt(match.groups!.version)
    }

    return query
  }

  private async discover (): Promise<void> {
    await this.broadcast.receive<Branch>('expose', this.merge.bind(this))
    await this.broadcast.transmit<null>('ping', null)
  }

  private merge (branch: Branch): void {
    try {
      this.tree.merge(branch.node, branch)

      console.info('Resource branch of ' +
        `'${branch.namespace}.${branch.component}' has been merged.`)
    } catch (exception) {
      console.error(exception)
    }
  }
}

const ETAG = /^"(?<version>\d{1,32})"/

export type Broadcast = bindings.Broadcast<Label>
