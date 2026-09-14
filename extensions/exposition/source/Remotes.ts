import { Locator, Connector, type Remote } from '@toa.io/core'
import type { Source } from '@toa.io/core/types'
import { type Host } from './Factory.ts'

export class Remotes extends Connector {
  private readonly host: Host
  private readonly cache: Record<string, Promise<Remote>> = {}

  public constructor(host: Host) {
    super()
    this.host = host
  }

  /**
   * @param version the component's, as the branch that announced the routes carries it. What it
   *   provides is asked of that version, so the contract a caller is held to is the one the
   *   routes belong to. Absent — a directive calling a component on its own behalf — the
   *   process's map says which version, as it does for any other caller.
   */
  public async discover(
    namespace: string,
    name: string,
    version?: string
  ): Promise<Remote> {
    const locator = new Locator(name, namespace)
    const key = locator.id + ':' + (version ?? 'local')

    this.cache[key] ??= this.locate(locator, version)

    return this.cache[key]
  }

  private async locate(locator: Locator, version?: string): Promise<Remote> {
    // the gateway is the origin of every call it forwards
    const remote = await this.host.remote(locator, SOURCE, version)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}

const SOURCE: Source = { service: 'exposition' }
