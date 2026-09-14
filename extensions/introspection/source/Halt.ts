import { Connector, Locator } from '@toa.io/core'
import { console } from 'openspan'
import { environment, timeout } from '@toa.io/generic'
import {
  CHECK_TIMEOUT,
  DEFAULT_GRACE,
  DEFAULT_QUIESCENCE,
  EDGES,
  HALT_GAP,
  MAX_GRACE,
  MAX_HALT,
  MAX_QUIESCENCE,
  MIN_GRACE,
  MIN_HALT,
  MIN_QUIESCENCE,
  NAMESPACE,
  SIGNAL,
  SIGNALS
} from '@toa.io/definitions/extensions.introspection'
import type { Host } from './Factory.ts'
import type { Remote } from '@toa.io/core'
import type { Message } from '@toa.io/core/types'

/**
 * Hears a halt, takes the process quiet, and reads the map to find out whether the deployment
 * went quiet with it.
 *
 * A signal is a record of `introspection.signals`, so what carries it is the event that
 * component publishes on a committed write. The subscription takes no group, which is a queue
 * of its own per process — so a signal written once reaches every process there is.
 *
 * **Any process may call the stop, and the rest obey without consulting their own view.**
 * Seeing stillness is an assertion, acted on alone and binding on everyone; seeing activity is
 * only an opinion, held quietly and given up if anyone asserts otherwise. Nothing has to be
 * agreed, which is the point: `UPDATED` is one field overwritten in place, so no two processes
 * reading the map read the same past, and a scheme that needed them to would need an atomic
 * read point this has nowhere to take from.
 *
 * This sits behind a gate of its own, and so goes down with everything else. Nothing is
 * listening while a halt lasts, which is what makes a halted process hold nothing open, and
 * why a halt cannot be called off once it is down: it ends when the interval it carried is up,
 * and by nothing else.
 */
export class Halt extends Connector {
  private readonly host: Host
  private readonly remotes: Record<string, Remote> = {}

  /** The halt this process is quiesced for, while it is. */
  private pending: Pending | null = null

  private timer: NodeJS.Timeout | null = null

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

  protected override async close(): Promise<void> {
    this.disarm()

    this.pending = null
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
   * What arrives crosses the wire and outlives the release that wrote it, so every number is
   * read as one and bounded here rather than trusted: the receiver is what has to come back.
   */
  private signalled(signal: Signal): void {
    if (signal?.type === 'halt') this.begin(signal)
    if (signal?.type === 'stop') this.obey(signal)
  }

  private begin(signal: Signal): void {
    // one at a time: a process quiesced for a halt is deaf to another, and to a redelivery
    if (this.pending !== null || typeof signal.id !== 'string') return

    const seconds = bound(signal.seconds, [MIN_HALT, MAX_HALT])
    const quiescence = bound(
      signal.quiescence,
      [MIN_QUIESCENCE, MAX_QUIESCENCE],
      DEFAULT_QUIESCENCE
    )
    const grace = bound(signal.grace, [MIN_GRACE, MAX_GRACE], DEFAULT_GRACE)

    if (seconds === null || quiescence === null || grace === null) return

    /*
     * The map is read against the moment the signal was written, not the moment this process
     * received it: `CREATED` and an edge's `UPDATED` are both written by the components of
     * this extension, so they are one clock, and what this process's clock says about either
     * is beside the point.
     */
    const since = typeof signal.CREATED === 'number' ? signal.CREATED : Date.now()

    this.pending = { id: signal.id, seconds, grace, since }

    console.warn('Halt signalled, going quiet', { seconds, quiescence })

    // the caller is a consumer callback, and this goes on to wait out a window under it
    void this.quiesce(quiescence)
  }

  private async quiesce(quiescence: number): Promise<void> {
    // in the background, so that the map is reachable by the time there is a decision to make
    this.acquire()

    try {
      await this.host.quiesce()
    } finally {
      // whatever the quiesce did, there is a decision owed: one never taken is a process
      // that is quiet for good
      this.later(quiescence + HALT_GAP, () => void this.decide())
    }
  }

  /**
   * The window is over. What the map says now is what this process has to go on, and what it
   * says is one thing: whether anything, anywhere in this region, was called since the signal.
   */
  private async decide(): Promise<void> {
    const pending = this.pending

    if (pending === null) return

    const still = await this.still(pending.since)

    // someone else's stop may have landed while the map was being read
    if (this.pending !== pending) return

    if (still) {
      console.warn('The deployment is still, calling the stop')

      // written first, because what stops every other process is the record and not this one
      if (await this.call(pending)) {
        this.down(pending.seconds)

        return
      }
    }

    /*
     * Someone is always last to catch on. This process has concluded, and what it does now is
     * wait for someone else's conclusion — listening, not looking again. It leaves the halt
     * only if no stop arrives, and the guard covers the other order: one that has left ignores
     * a stop that lands after.
     */
    console.warn('The deployment is working, waiting for another opinion', {
      grace: pending.grace
    })

    this.later(pending.grace, () => void this.give())
  }

  /** No stop came. Nothing was closed, so nothing has to be built again. */
  private async give(): Promise<void> {
    if (this.pending === null) return

    this.pending = null

    console.warn('Halt cancelled, this process is working')

    await this.host.cancel()
  }

  /** A stop is obeyed only while this process is quiesced for the halt it answers. */
  private obey(signal: Signal): void {
    const pending = this.pending

    if (pending === null || signal.signal !== pending.id) return

    this.down(pending.seconds)
  }

  private down(seconds: number): void {
    this.disarm()

    this.pending = null

    this.host.stop(seconds)
  }

  /**
   * Whether nothing has been called in this region since the signal.
   *
   * The map is what the whole fleet writes, and a flush that observed nothing writes nothing —
   * so a region with no edge newer than the signal is a region where nothing was called. It is
   * read rather than voted on, and this process's own view of itself is not part of it: what a
   * process is handling it has written no edge for yet, and a stop called while it was would
   * still wait for it rather than interrupt it.
   *
   * Anything unanswered is activity. A process that cannot read the map does not stop the
   * deployment on a guess.
   */
  private async still(since: number): Promise<boolean> {
    const edges = this.remotes[EDGES]

    if (edges === undefined) return false

    const criteria = `UPDATED>${since};REGION==${REGION}`

    try {
      const reply = await race(
        edges.invoke('enumerate', { query: { criteria, limit: 1 } })
      )

      const rows = Array.isArray(reply) ? reply : reply?.output

      if (!Array.isArray(rows)) {
        console.warn('The map did not answer, the halt is not this process to call')

        return false
      }

      return rows.length === 0
    } catch (error) {
      console.error('The map could not be read', { message: (error as Error).message })

      return false
    }
  }

  /** Writes the stop. It reaches every process as the halt did, this one included. */
  private async call(pending: Pending): Promise<boolean> {
    const signals = this.remotes[SIGNALS]

    if (signals === undefined) return false

    try {
      const reply = await race(
        signals.invoke('create', {
          input: { type: 'stop', seconds: pending.seconds, signal: pending.id }
        })
      )

      if (reply?.error !== undefined || reply?.exception !== undefined) {
        console.error('The stop was refused', { reply })

        return false
      }

      return true
    } catch (error) {
      console.error('The stop could not be written', {
        message: (error as Error).message
      })

      return false
    }
  }

  private later(seconds: number, fn: () => void): void {
    this.disarm()

    this.timer = setTimeout(fn, seconds * 1000)
    this.timer.unref()
  }

  private disarm(): void {
    if (this.timer === null) return

    clearTimeout(this.timer)
    this.timer = null
  }

  /** Runs in the background: discovery waits for the explorer as long as it takes. */
  private acquire(): void {
    for (const name of [EDGES, SIGNALS]) {
      if (name in this.remotes) continue

      void this.reach(name).catch((error: Error) => {
        console.error('Introspection cannot reach its explorer', {
          message: error.message
        })
      })
    }
  }

  private async reach(name: string): Promise<void> {
    const remote = await this.host.remote(new Locator(name, NAMESPACE))

    this.depends(remote)

    await remote.connect()

    this.remotes[name] = remote
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

/** A number as it came, within what this release accepts, or `null` where it is not one. */
function bound(
  value: unknown,
  [min, max]: [number, number],
  fallback?: number
): number | null {
  if (value === undefined && fallback !== undefined) return fallback

  if (typeof value !== 'number' || !Number.isFinite(value)) return null

  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * A quiesced process that waits for an answer that never comes is a process that never comes
 * back, so every call a decision rests on is given a deadline. What times out is activity.
 */
async function race(call: Promise<any>): Promise<any> {
  return await Promise.race([call, timeout(CHECK_TIMEOUT).then(() => undefined)])
}

interface Pending {
  id: string
  seconds: number
  grace: number
  since: number
}

interface Signal {
  type?: string
  id?: string
  seconds?: number
  quiescence?: number
  grace?: number
  /** the halt a stop answers */
  signal?: string
  CREATED?: number
}

/** The region this deployment is, which is the only one its map answers for. */
const REGION = Number(environment.get('TOA_REGION') ?? 0)
