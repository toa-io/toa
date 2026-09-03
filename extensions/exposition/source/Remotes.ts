import { Locator, Connector, type Remote, type Source } from '@toa.io/core'
import { type Host } from './Factory.js'

export class Remotes extends Connector {
  private readonly host: Host
  private readonly cache: Record<string, Promise<Remote>> = {}

  public constructor (host: Host) {
    super()
    this.host = host
  }

  public async discover (namespace: string, name: string, version: string = 'local'): Promise<Remote> {
    const locator = new Locator(name, namespace)
    const key = locator.id + ':' + version

    this.cache[key] ??= this.locate(locator)

    return this.cache[key]
  }

  private async locate (locator: Locator): Promise<Remote> {
    // the gateway is the origin of every call it forwards
    const remote = await this.host.remote(locator, SOURCE)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}

const SOURCE: Source = { service: 'exposition' }
