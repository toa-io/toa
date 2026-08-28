import { setTimeout } from 'node:timers/promises'
import { Connector } from '@toa.io/core'
import { ANNOUNCE_INTERVAL } from './const'
import type { Reporter } from './Reporter'
import type { Node } from './model'

/**
 * Announces the static description of a component.
 *
 * Delivery is guaranteed, so the repeat is not about reliability — it keeps
 * `_updated` fresh, which is how a removed component fades off the map.
 */
export class Tenant extends Connector {
  private readonly reporter: Reporter
  private readonly node: Node
  private stopped = false

  public constructor (reporter: Reporter, node: Node) {
    super()

    this.reporter = reporter
    this.node = node

    this.depends(reporter)
  }

  protected override async open (): Promise<void> {
    this.reporter.expose(this.node)

    void this.announce()
  }

  protected override dispose (): void {
    this.stopped = true
  }

  private async announce (): Promise<void> {
    while (!this.stopped) {
      await setTimeout(ANNOUNCE_INTERVAL, undefined, { ref: false })

      if (this.stopped)
        break

      this.reporter.expose(this.node)
    }
  }
}
