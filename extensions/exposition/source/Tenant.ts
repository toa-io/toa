import { Connector } from '@toa.io/core'
import type { bindings } from '@toa.io/core'
import type { Label } from './discovery'
import type { Branch } from './Branch'

export class Tenant extends Connector {
  private readonly broadcast: Broadcast
  private readonly branch: Branch

  public constructor (broadcast: Broadcast, branch: Branch) {
    super()

    this.broadcast = broadcast
    this.branch = branch

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
