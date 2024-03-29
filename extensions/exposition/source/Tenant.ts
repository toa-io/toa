import { Connector, type Locator, type bindings } from '@toa.io/core'
import { type Label } from './discovery'
import { type Branch } from './Branch'
import type * as RTD from './RTD/syntax'

export class Tenant extends Connector {
  private readonly broadcast: Broadcast
  private readonly branch: Branch

  public constructor (broadcast: Broadcast, locator: Locator, node: RTD.Node) {
    super()

    this.broadcast = broadcast

    this.branch = {
      namespace: locator.namespace,
      component: locator.name,
      isolated: locator.namespace === 'identity',
      node
    }

    this.depends(broadcast)
  }

  public override async open (): Promise<void> {
    await this.expose()
    await this.broadcast.receive('ping', this.expose.bind(this))
  }

  private async expose (): Promise<void> {
    await this.broadcast.transmit('expose', this.branch)
  }
}

type Broadcast = bindings.Broadcast<Label>
