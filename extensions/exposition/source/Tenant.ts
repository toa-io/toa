import { setTimeout } from 'node:timers/promises'
import { Connector } from '@toa.io/core'
import { BRANCH_TTL } from './const'
import type { bindings } from '@toa.io/core'
import type { Label } from './discovery'
import type { Branch } from './Branch'

export class Tenant extends Connector {
  private readonly broadcast: Broadcast
  private readonly branch: Branch
  private started = 0
  private stopped = false

  public constructor (broadcast: Broadcast, branch: Branch) {
    super()

    this.broadcast = broadcast
    this.branch = branch

    this.depends(broadcast)
  }

  public override async open (): Promise<void> {
    this.started = Date.now()

    await this.expose()
    await this.broadcast.receive('ping', this.expose.bind(this))

    void this.announce()
  }

  /**
   * Announcing is stopped where the teardown begins, not in `dispose`, which a connector
   * runs after every one of its dependencies has gone. A component on its way out that
   * announces itself once more has its routes held open by whoever is listening, and the
   * requests that follow reach nothing.
   */
  protected override async close (): Promise<void> {
    this.stopped = true
  }

  private async announce (): Promise<void> {
    while (!this.stopped) {
      const delay = exposeInterval(Date.now() - this.started)

      await setTimeout(delay, undefined, { ref: false })

      if (this.stopped)
        break

      await this.expose()
    }
  }

  private async expose (): Promise<void> {
    // the ping subscription outlives the announcing loop, and answering one on the way out
    // is the same announcement by another route
    if (this.stopped)
      return

    await this.broadcast.transmit('expose', this.branch)
  }
}

function exposeInterval (uptime: number): number {
  return Math.round(EXPOSE_MAX - (EXPOSE_MAX - EXPOSE_MIN) * Math.exp(-uptime / EXPOSE_TAU))
}

const EXPOSE_MIN = 5_000
const EXPOSE_MAX = Math.round(BRANCH_TTL / 2.1)
const EXPOSE_TAU = 900_000

type Broadcast = bindings.Broadcast<Label>
