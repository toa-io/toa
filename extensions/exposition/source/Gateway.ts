import { Connector, type bindings } from '@toa.io/core'
import { type Branch } from './RTD/syntax'
import { type HTTPServer } from './HTTPServer'
import { type Tree } from './RTD/Tree'
import { type Label } from './Label'

export class Gateway extends Connector {
  private readonly broadcast: Broadcast
  private readonly server: HTTPServer
  private readonly tree: Tree

  public constructor (broadcast: Broadcast, server: HTTPServer, tree: Tree) {
    super()

    this.broadcast = broadcast
    this.server = server
    this.tree = tree

    this.depends(broadcast)
  }

  public override async open (): Promise<void> {
    await this.broadcast.receive<Branch>('expose', this.merge.bind(this))
    await this.broadcast.transmit<null>('ping', null)

    console.info('Gateway has started and is awaiting resource branches.')
  }

  private merge (branch: Branch): void {
    this.tree.merge(branch)

    console.info('Resource branch of ' +
      `'${branch.namespace}.${branch.component}' has been merged.`)
  }
}

type Broadcast = bindings.Broadcast<Label>
