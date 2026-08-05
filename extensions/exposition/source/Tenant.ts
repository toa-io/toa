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

  protected override dispose (): void {
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
