import { Connector, type bindings } from '@toa.io/core'
import { type Tree, type syntax } from './RTD'
import { type Label } from './discovery'
import * as http from './HTTP'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly server: http.Server
  private readonly tree: Tree

  public constructor (broadcast: Broadcast, server: http.Server, tree: Tree) {
    super()

    this.broadcast = broadcast
    this.server = server
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

  private async process (input: http.IncomingMessage): Promise<http.OutgoingMessage> {
    const node = this.tree.match(input.path) ?? this.throw(http.NotFound)
    const method = node?.methods.get(input.method) ?? this.throw(http.MethodNotAllowed)
    const value = await method?.call({}, {})

    return { headers: {}, value }
  }

  private throw (Exception: new () => Error): null {
    throw new Exception()
  }

  private async discover (): Promise<void> {
    await this.broadcast.receive<syntax.Branch>('expose', this.merge.bind(this))
    await this.broadcast.transmit<null>('ping', null)
  }

  private merge (branch: syntax.Branch): void {
    this.tree.merge(branch)

    console.info('Resource branch of ' +
      `'${branch.namespace}.${branch.component}' has been merged.`)
  }
}

type Broadcast = bindings.Broadcast<Label>
