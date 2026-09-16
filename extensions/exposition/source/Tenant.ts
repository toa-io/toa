import { setTimeout } from 'node:timers/promises'
import { Connector } from '@toa.io/core'
import { BRANCH_TTL } from '@toa.io/definitions/extensions.exposition'
import type { Announcements } from './Announcements.ts'
import type { Branch } from './Branch.ts'

export class Tenant extends Connector {
  private readonly announcements: Announcements
  private readonly branch: Omit<Branch, 'timestamp'>
  private started = 0
  private stopped = false
  private withdraw: (() => void) | undefined

  public constructor(announcements: Announcements, branch: Omit<Branch, 'timestamp'>) {
    super()

    this.announcements = announcements
    this.branch = branch

    this.depends(announcements)
  }

  public override async open(): Promise<void> {
    this.started = Date.now()

    // counted in before the first announcement: what answers an ask made in between is the
    // announcement itself, and one made twice is the same announcement
    this.withdraw = this.announcements.register(this.expose.bind(this))

    await this.expose()

    void this.announce()
  }

  /**
   * Announcing is stopped where the teardown begins, not in `dispose`, which a connector
   * runs after every one of its dependencies has gone. A component on its way out that
   * announces itself once more has its routes held open by whoever is listening, and the
   * requests that follow reach nothing.
   */
  protected override async close(): Promise<void> {
    this.stopped = true

    this.withdraw?.()
  }

  private async announce(): Promise<void> {
    while (!this.stopped) {
      const delay = exposeInterval(Date.now() - this.started)

      await setTimeout(delay, undefined, { ref: false })

      if (this.stopped) break

      await this.expose()
    }
  }

  private async expose(): Promise<void> {
    // the ping subscription outlives the announcing loop, and answering one on the way out
    // is the same announcement by another route
    if (this.stopped) return

    await this.announcements.transmit({ ...this.branch, timestamp: this.started })
  }
}

function exposeInterval(uptime: number): number {
  return Math.round(
    EXPOSE_MAX - (EXPOSE_MAX - EXPOSE_MIN) * Math.exp(-uptime / EXPOSE_TAU)
  )
}

const EXPOSE_MIN = 5_000
const EXPOSE_MAX = Math.round(BRANCH_TTL / 2.1)
const EXPOSE_TAU = 900_000
