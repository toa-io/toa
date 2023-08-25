import { Connector, type bindings } from '@toa.io/core'
import { type Tree } from './RTD'
import { type Label } from './discovery'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import { type Branch } from './Branch'
import { type Endpoint } from './Endpoint'
import { type Directives } from './Directives'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree<Endpoint, Directives>

  public constructor (broadcast: Broadcast, server: http.Server, tree: Tree<Endpoint, Directives>) {
    super()

    this.broadcast = broadcast
    this.tree = tree

    this.depends(broadcast)
    this.depends(server)

    server.attach(this.process.bind(this))
  }

  protected override async open (): Promise<void> {
    await this.discover()

    console.info('Gateway has started and is awaiting resource branches.')
  }

  protected override async dispose (): Promise<void> {
    console.info('Gateway is closed.')
  }

  private async process (request: http.IncomingMessage): Promise<http.OutgoingMessage> {
    if (request.path[request.path.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required.')

    const match = this.tree.match(request.path)

    if (match === null)
      throw new http.NotFound()

    const interrupt = await match.node.directives.apply(request)

    if (interrupt !== null)
      return interrupt

    if (!(request.method in match.node.methods))
      throw new http.MethodNotAllowed()

    const body = await match.node.methods[request.method]
      .call(request.body, request.query, match.parameters)
      .catch(rethrow)

    return { body }
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
