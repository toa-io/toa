import { Locator, Connector, type Remote, type Source } from '@toa.io/core'
import { type Bootloader } from './Factory'

export class Remotes extends Connector {
  private readonly boot: Bootloader
  private readonly cache: Record<string, Promise<Remote>> = {}

  public constructor (boot: Bootloader) {
    super()
    this.boot = boot
  }

  public async discover (namespace: string, name: string, version: string = 'local'): Promise<Remote> {
    const locator = new Locator(name, namespace)
    const key = locator.id + ':' + version

    this.cache[key] ??= this.locate(locator)

    return this.cache[key]
  }

  private async locate (locator: Locator): Promise<Remote> {
    // the gateway is the origin of every call it forwards
    const remote = await this.boot.remote(locator, SOURCE)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}

const SOURCE: Source = { service: 'exposition' }
