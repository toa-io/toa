import { Connector, type Locator, type bindings } from '@toa.io/core'
import type * as RTD from './RTD/syntax'

export class Tenant extends Connector {
  private readonly broadcast: bindings.Broadcast
  private readonly branch: RTD.Branch

  public constructor (broadcast: bindings.Broadcast, { name, namespace }: Locator, node: RTD.Node) {
    super()

    this.broadcast = broadcast
    this.branch = { name, namespace, node }

    this.depends(broadcast)
  }

  public async open (): Promise<void> {
    await this.expose()
    await this.broadcast.receive('ping', this.expose.bind(this))

    console.info(`Exposition Tenant for '${this.branch.namespace}.${this.branch.name}' has started.`)
  }

  private async expose (): Promise<void> {
    await this.broadcast.transmit('expose', this.branch)
  }
}
