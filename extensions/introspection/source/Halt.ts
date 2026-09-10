import { Connector } from '@toa.io/core'
import { console } from 'openspan'
import { MAX_HALT, MIN_HALT, SIGNAL } from '@toa.io/definitions/extensions.introspection'
import type { Host } from './Factory.js'
import type { Message } from '@toa.io/core/types'

/**
 * Hears the halt signal, and stops the process it runs in.
 *
 * A signal is a record of `introspection.signals`, so what carries it is the event that
 * component publishes on a committed write. The subscription takes no group, which is a queue
 * of its own per process — so a signal written once reaches every process there is.
 *
 * This sits behind a gate of its own, and so goes down with everything else. Nothing is
 * listening while a halt lasts, which is what makes a halted process hold nothing open, and
 * why a halt cannot be called off: it ends when the interval it carried is up, and by nothing
 * else.
 */
export class Halt extends Connector {
  private readonly host: Host

  public constructor(host: Host) {
    super()

    this.host = host
  }

  protected override async open(): Promise<void> {
    /*
     * Deliberately not awaited. Reaching the component is a discovery, which waits as long as
     * it takes, and in the explorer process the component being looked up is one this same
     * process is still starting. A halt is not worth holding a boot for.
     */
    void this.subscribe().catch((error: Error) => {
      console.error('Introspection cannot subscribe to signals', {
        message: error.message
      })
    })
  }

  private async subscribe(): Promise<void> {
    const consumer = await this.host.receive(
      SIGNAL,
      new Subscription(this.signalled.bind(this))
    )

    this.depends(consumer)

    await consumer.connect()
  }

  /**
   * What arrives crosses the wire and outlives the release that wrote it, so the interval is
   * read as a number and bounded here rather than trusted: the receiver is what has to come
   * back.
   */
  private signalled(signal: Signal): void {
    if (signal?.type !== 'halt') return

    const seconds = Math.min(MAX_HALT, Math.max(MIN_HALT, Math.round(signal.seconds)))

    if (!Number.isFinite(seconds)) return

    console.warn('Halt signalled', { seconds })

    this.host.halt(seconds)
  }
}

/** What a binding hands a message to; the connector's lifecycle is not the handler's. */
class Subscription extends Connector {
  private readonly handler: (signal: Signal) => void

  public constructor(handler: (signal: Signal) => void) {
    super()

    this.handler = handler
  }

  public async receive(message: Message<Signal>): Promise<void> {
    this.handler(message.payload)
  }
}

interface Signal {
  type?: string
  seconds: number
}
