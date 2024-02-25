import { type bindings, Connector } from '@toa.io/core'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import type { Interception } from './Interception'
import type { Maybe } from '@toa.io/types'
import type { Method, Parameter, Tree } from './RTD'
import type { Label } from './discovery'
import type { Branch } from './Branch'
import type { Endpoint } from './Endpoint'
import type { Directives } from './Directive'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree<Endpoint, Directives>
  private readonly interceptor: Interception
  private readonly server: Connector

  // eslint-disable-next-line max-params, max-len
  public constructor (broadcast: Broadcast, server: http.Server, tree: Tree<Endpoint, Directives>, interception: Interception) {
    super()

    this.broadcast = broadcast
    this.tree = tree
    this.interceptor = interception
    this.server = server

    this.depends(broadcast)
    // this.depends(server)

    server.attach(this.process.bind(this))
  }

  protected override async open (): Promise<void> {
    await this.discover()

    console.info('Gateway has started and is awaiting resource branches.')
  }

  protected override dispose (): void {
    console.info('Gateway is closed.')
  }

  private async process (request: http.IncomingMessage): Promise<http.OutgoingMessage> {
    const interception = await request.timing.capture('gate:intercept',
      this.interceptor.intercept(request))

    if (interception !== null)
      return interception

    const match = this.tree.match(request.locator.pathname)

    if (match === null)
      throw new http.NotFound()

    const { node, parameters } = match

    if (!(request.method in node.methods))
      throw new http.MethodNotAllowed()

    const method = node.methods[request.method]

    const interruption = await request.timing.capture('gate:preflight',
      method.directives.preflight(request, parameters))

    const response = interruption ??
      await request.timing.capture('gate:call', this.call(method, request, parameters))

    await request.timing.capture('gate:settle', method.directives.settle(request, response))

    return response
  }

  private async call
  (method: Method<Endpoint, Directives>, request: http.IncomingMessage, parameters: Parameter[]):
  Promise<http.OutgoingMessage> {
    if (request.locator.pathname[request.locator.pathname.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required.')

    if (request.encoder === null)
      throw new http.NotAcceptable()

    if (method.endpoint === null)
      throw new http.MethodNotAllowed()

    const body = await request.parse()
    const query = Object.fromEntries(request.locator.searchParams)

    const reply = await method.endpoint
      .call(body, query, parameters)
      .catch(rethrow) as Maybe<unknown>

    if (reply instanceof Error)
      throw new http.Conflict(reply)

    return { body: reply }
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

type Broadcast = bindings.Broadcast<Label>
