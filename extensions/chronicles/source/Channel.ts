import {
  BINDING,
  CHANNEL,
  DEAD,
  QUEUE,
  ROUTE
} from '@toa.io/definitions/extensions.chronicles'
import { broker } from './settings.ts'
import type { Message } from './Message.ts'
import type { bindings, extensions } from '@toa.io/core/types'

/**
 * The process's one publisher to the channel. The queue ClickHouse consumes is declared before
 * the first message is sent, because a message routed to no queue comes back, and a row whose
 * message came back is marked published all the same: the broker confirmed it.
 */
export class Channel {
  private readonly host: extensions.Host
  private outbound: Promise<bindings.Outbound> | undefined

  public constructor(host: extensions.Host) {
    this.host = host
  }

  /**
   * One per process — and per build of its tree. A communication that went down with a tree it
   * belonged to is sealed, and what was sent through it afterwards would fail to leave.
   */
  public async open(): Promise<bindings.Outbound> {
    const current = await this.outbound?.catch(() => undefined)

    if (current === undefined || current.disposed) this.outbound = this.create()

    return await this.outbound!
  }

  public async send(outbound: bindings.Outbound, message: Message): Promise<void> {
    await outbound.send(ROUTE, message)
  }

  private async create(): Promise<bindings.Outbound> {
    const outbound = await this.host.outbound(BINDING, CHANNEL, [broker()])

    if (outbound.retain === undefined)
      throw new Error(
        `Chronicles are carried by a binding that retains a queue; '${BINDING}' does not.`
      )

    await outbound.connect()

    // what ClickHouse rejects is routed back under `dead`, where its own queue keeps it
    await outbound.retain(DEAD, DEAD_ROUTE)
    await outbound.retain(QUEUE, ROUTE, DEAD_ROUTE)

    return outbound
  }
}

const DEAD_ROUTE = 'dead'
