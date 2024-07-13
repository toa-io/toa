import assert from 'node:assert'
import { console } from 'openspan'
import { type bindings, Connector } from '@toa.io/core'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import type { Interception } from './Interception'
import type { Node, Method, Parameter, Tree, Match } from './RTD'
import type { Label } from './discovery'
import type { Branch } from './Branch'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree
  private readonly interceptor: Interception

  public constructor (broadcast: Broadcast, tree: Tree, interception: Interception) {
    super()

    this.broadcast = broadcast
    this.tree = tree
    this.interceptor = interception

    this.depends(broadcast)
  }

  public async process (context: http.Context): Promise<http.OutgoingMessage> {
    const interception = await context.timing.capture('intercept',
      this.interceptor.intercept(context))

    if (interception !== null)
      return interception

    const { node, parameters } = this.match(context)

    if (context.request.method === 'OPTIONS')
      return await this.explain(node, parameters)

    if (!(context.request.method in node.methods))
      throw new http.MethodNotAllowed()

    const method = node.methods[context.request.method]

    const interruption = await context.timing.capture('preflight',
      method.directives.preflight(context, parameters)).catch(rethrow)

    const response = interruption ??
      await context.timing.capture('call', this.call(method, context, parameters))

    await context.timing.capture('settle',
      method.directives.settle(context, response)).catch(rethrow)

    return response
  }

  protected override async open (): Promise<void> {
    await this.discover()

    console.info('Gateway started')
  }

  protected override dispose (): void {
    console.info('Gateway is closed')
  }

  private match (context: http.Context): Match {
    const match = this.tree.match(context.url.pathname)

    if (match === null)
      throw new http.NotFound('Route not found')

    if (match.node.forward === null)
      return match

    const destination = match.node.forward.replace(/\/:([^/]+)/g,
      (_, name) => {
        const value = match.parameters.find((parameter) => parameter.name === name)?.value

        assert.ok(value !== undefined, `Forwarded parameter '${name}' not found`)

        return `/${value}`
      })

    const forward = this.tree.match(destination)

    assert.ok(forward !== null, 'Forwarded route not found')

    return forward
  }

  private async call (method: Method, context: http.Context, parameters: Parameter[]): Promise<http.OutgoingMessage> {
    if (context.url.pathname[context.url.pathname.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required')

    if (context.encoder === null)
      throw new http.NotAcceptable()

    if (method.endpoint === null)
      throw new http.MethodNotAllowed()

    return await method.endpoint
      .call(context, parameters)
      .catch(rethrow) as http.OutgoingMessage
  }

  private async explain (node: Node, parameters: Parameter[]): Promise<http.OutgoingMessage> {
    const body = await node.explain(parameters)
    const allow = [...Object.keys(node.methods)].join(', ')
    const headers = new Headers({ allow })

    return { body, headers }
  }

  private async discover (): Promise<void> {
    await this.broadcast.receive<Branch>('expose', this.merge.bind(this))
    await this.broadcast.transmit<null>('ping', null)
  }

  private merge (branch: Branch): void {
    try {
      this.tree.merge(branch.node, branch)

      console.info('Branch merged', { source: branch.namespace + '.' + branch.component })
    } catch (exception) {
      console.error('Branch merge exception', exception)
    }
  }
}

export type Broadcast = bindings.Broadcast<Label>
