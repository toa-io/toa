import { type bindings, Connector } from '@toa.io/core'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import type { Interceptor } from './Interception'
import type { Maybe } from '@toa.io/types'
import type { Method, Parameter, Tree } from './RTD'
import type { Label } from './discovery'
import type { Branch } from './Branch'
import type { Endpoint } from './Endpoint'
import type { Directives } from './Directive'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree<Endpoint, Directives>
  private readonly interceptor: Interceptor

  // eslint-disable-next-line max-params, max-len
  public constructor (broadcast: Broadcast, server: http.Server, tree: Tree<Endpoint, Directives>, interception: Interceptor) {
    super()

    this.broadcast = broadcast
    this.tree = tree
    this.interceptor = interception

    this.depends(broadcast)
    this.depends(server)

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
    const interception = await this.interceptor.intercept(request)

    if (interception !== null)
      return interception

    const match = this.tree.match(request.path)

    if (match === null)
      throw new http.NotFound()

    const { node, parameters } = match

    if (!(request.method in node.methods))
      throw new http.MethodNotAllowed()

    const method = node.methods[request.method]
    const interruption = await method.directives.preflight(request, parameters)
    const response = interruption ?? await this.call(method, request, parameters)

    await method.directives.settle(request, response)

    return response
  }

  private async call
  (method: Method<Endpoint, Directives>, request: http.IncomingMessage, parameters: Parameter[]):
  Promise<http.OutgoingMessage> {
    if (request.path[request.path.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required.')

    if (request.encoder === null)
      throw new http.NotAcceptable()

    if (method.endpoint === null)
      throw new http.MethodNotAllowed()

    const body = await request.parse()

    if ('embed' in request && typeof body === 'object' && body !== null)
      Object.assign(body, request.embed)

    const reply = await method.endpoint
      .call(body, request.query, parameters)
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
