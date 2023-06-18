import { Connector, type bindings } from '@toa.io/core'
import { type Request, type Response } from 'express'
import { type Branch } from './RTD/syntax'
import { type HTTPServer } from './HTTPServer'
import { type Tree } from './RTD/Tree'
import { type Label } from './discovery'

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
    this.depends(server)
  }

  protected override async open (): Promise<void> {
    // await this.handle()
    await this.discover()

    console.info('Gateway has started and is awaiting resource branches.')
  }

  protected override async dispose (): Promise<void> {
    console.info('Gateway is closed.')
  }

  private handle (): void {
    // this.server.handle(this.process.bind(this))
  }

  private process (request: Request, response: Response): void {

  }

  private async discover (): Promise<void> {
    await this.broadcast.receive<Branch>('expose', this.merge.bind(this))
    await this.broadcast.transmit<null>('ping', null)
  }

  private merge (branch: Branch): void {
    this.tree.merge(branch)

    console.info('Resource branch of ' +
      `'${branch.namespace}.${branch.component}' has been merged.`)
  }
}

type Broadcast = bindings.Broadcast<Label>
