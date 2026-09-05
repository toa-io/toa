import { Connector } from '@toa.io/core'
import type { Host } from './Factory.js'
import type { Locator, Remote } from '@toa.io/core'
import type { Reply, Request } from '@toa.io/core/types'

/**
 * The component a tenant belongs to, as something to call.
 *
 * Resolved on the first call and not before: a tenant is created ahead of the components of its
 * composition, so at that point there is nothing to look up yet. A pulse calls at a boundary,
 * which is long after everything is up.
 */
export class Local extends Connector {
  private readonly host: Host
  private readonly locator: Locator
  private remote?: Promise<Remote>

  public constructor (host: Host, locator: Locator) {
    super()

    this.host = host
    this.locator = locator
  }

  public async invoke (endpoint: string, request: Request): Promise<Reply> {
    this.remote ??= this.locate()

    return await (await this.remote).invoke(endpoint, request)
  }

  private async locate (): Promise<Remote> {
    const remote = await this.host.remote(this.locator)

    this.depends(remote)

    await remote.connect()

    return remote
  }
}
