import { Locator, Connector, type Component } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Remotes extends Connector {
  private readonly boot: Bootloader
  private readonly remotes = new Map<string, Component>()

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  public async discover (namespace: string, name: string): Promise<Component> {
    const locator = new Locator(name, namespace)

    if (!this.remotes.has(locator.id)) {
      const remote = await this.boot.remote(locator)

      this.depends(remote)

      this.remotes.set(locator.id, remote)
    }

    return this.remotes.get(locator.id) as Component
  }
}
