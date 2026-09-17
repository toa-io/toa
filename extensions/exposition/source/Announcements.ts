import { Connector } from '@toa.io/core'
import type { Branch } from './Branch.ts'
import type { Label } from './discovery.ts'
import type { bindings } from '@toa.io/core/types'

/**
 * What every tenant in this process announces through, and what answers the gateway when it
 * asks. One subscription rather than one per tenant: a subscription with no group consumes a
 * queue the binding remembers by the exchange alone, so a second one here would share it and
 * each ask would reach one tenant of the two.
 *
 * It is held by the extension's factory, which outlives every composition it hands a tenant to,
 * and is taken down once the last of them has gone.
 */
export class Announcements extends Connector {
  private readonly broadcast: Broadcast
  private readonly tenants = new Set<Announce>()

  public constructor(broadcast: Broadcast) {
    super()

    this.broadcast = broadcast

    this.depends(broadcast)
  }

  public override async open(): Promise<void> {
    await this.broadcast.receive('ping', this.announce.bind(this))
  }

  /** Counts a tenant in, until what it returns is called. */
  public register(announce: Announce): () => void {
    this.tenants.add(announce)

    return () => this.tenants.delete(announce)
  }

  public async transmit(branch: Branch): Promise<void> {
    await this.broadcast.transmit('expose', branch)
  }

  private async announce(): Promise<void> {
    await Promise.all(Array.from(this.tenants, (announce) => announce()))
  }
}

type Announce = () => Promise<void>

type Broadcast = bindings.Broadcast<Label>
