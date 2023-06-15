import { Locator, Connector, type Component } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Remotes extends Connector {
  private readonly boot: Bootloader

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  public async discover (namespace: string, name: string): Promise<Component> {
    const locator = new Locator(name, namespace)
    const remote = await this.boot.remote(locator)

    this.depends(remote)

    return remote
  }
}