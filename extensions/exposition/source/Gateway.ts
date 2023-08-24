import { Connector, type bindings } from '@toa.io/core'
import { type Tree } from './RTD'
import { type Label } from './discovery'
import * as http from './HTTP'
import { rethrow } from './exceptions'
import { type Branch } from './Branch'
import { type Endpoint } from './Endpoint'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly tree: Tree<Endpoint>

  public constructor (broadcast: Broadcast, server: http.Server, tree: Tree<Endpoint>) {
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

  private async process (message: http.IncomingMessage): Promise<http.OutgoingMessage> {
    if (message.path[message.path.length - 1] !== '/')
      throw new http.NotFound('Trailing slash is required.')

    const body = await this.call(message)

    return { headers: {}, body }
  }

  private async call (message: http.IncomingMessage): Promise<any> {
    const match = this.tree.match(message.path)

    if (match === null) throw new http.NotFound()

    const method = match.node.methods[message.method]

    if (method === undefined) throw new http.MethodNotAllowed()

    return await method
      .call(message.body, message.query, match.parameters)
      .catch(rethrow)
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
