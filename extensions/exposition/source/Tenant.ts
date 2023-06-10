import { Connector } from '@toa.io/core'

export class Tenant extends Connector {
  private readonly broadcast: bindings.Broadcast
  private readonly branch: RTD.Branch

  constructor (broadcast: bindings.Broadcast, { name, namespace }: Locator, node: RTD.Node) {
    super()

    this.broadcast = broadcast
    this.branch = { name, namespace, node }

    this.depends(broadcast)
  }

  async open () {
    await this.expose()
    await this.broadcast.receive('ping', this.expose.bind(this))
  }

  private async expose () {
    await this.broadcast.transmit('expose', this.branch)
  }
}

import type { Locator, bindings } from '@toa.io/core'
import type * as RTD from './RTD/syntax'
