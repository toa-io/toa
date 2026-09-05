import { console } from 'openspan'
import { Connector } from '@toa.io/core'
import type { Local } from './Local.js'
import type { SpanOptions } from 'openspan'
import type { Locator } from '@toa.io/core'
import type { atomicity } from '@toa.io/core/types'

/**
 * A recurring call to an operation of its own component, on the cadence its manifest states.
 *
 * Nothing is stored. The cycle is split into `n` intervals and the current one is a function of
 * the clock, so every replica computes the same `i` without talking to any other; the one that
 * owns `i` is the one that calls. An interval no replica was alive for is not made up
 * afterwards — the operation is expected to select by what is still due rather than by where
 * the cycle has reached.
 */
export class Pulse extends Connector {
  private readonly endpoint: string
  private readonly label: string

  /** milliseconds one whole cycle takes */
  private readonly cycle: number

  /** intervals the cycle is split into */
  private readonly n: number

  private readonly local: Local
  private readonly atom: atomicity.Atom

  /** span options, built once */
  private readonly options: SpanOptions

  /**
   * The ordinal of the interval this process has already handled, so an early wake-up is not a
   * second call. An ordinal and not an index: with one interval per cycle the index never
   * changes, and comparing it would suppress every call after the first.
   */
  private fired = 0

  private timer?: NodeJS.Timeout

  /** the call in flight, awaited on close */
  private firing?: Promise<unknown>

  private closing = false

  public constructor (definition: Definition, local: Local, atom: atomicity.Atom) {
    super()

    const { locator, endpoint, cycle, intervals } = definition

    this.endpoint = endpoint
    this.label = `${locator.id}.${endpoint}`
    this.cycle = cycle * 1000
    this.n = intervals

    this.local = local
    this.atom = atom

    this.depends(local)
    this.depends(atom)

    this.options = {
      name: `${this.label} pulse`,
      kind: 'producer',
      service: locator.id
    }
  }

  /**
   * How many intervals have passed since the epoch, `now` included. Against the cycle rather
   * than by adding up gaps, so a cycle that does not divide evenly into its intervals neither
   * drifts nor accumulates error.
   *
   * The arithmetic is exact rather than double: `now` is milliseconds since 1970 and `n` may be
   * as large as the cycle has seconds, so their product leaves the range a double is exact in
   * for a long cycle cut finely. It is evaluated once per interval, where this costs nothing.
   */
  public ordinal (now: number): number {
    return Number(BigInt(now) * BigInt(this.n) / BigInt(this.cycle))
  }

  /** Which of the cycle's intervals `now` falls in. */
  public index (now: number): number {
    return this.ordinal(now) % this.n
  }

  /** When the interval `now` falls in gives way to the next one. */
  public boundary (now: number): number {
    const cycle = BigInt(this.cycle)
    const n = BigInt(this.n)
    const next = BigInt(this.ordinal(now) + 1)

    // the earliest millisecond whose ordinal is the next one
    return Number((next * cycle + n - 1n) / n)
  }

  protected override async open (): Promise<void> {
    // whatever interval it is now, this replica was not there when it began, so it is not
    // this one's to call — the first call is at the next boundary
    this.fired = this.ordinal(Date.now())

    this.arm()
  }

  protected override async close (): Promise<void> {
    this.closing = true

    clearTimeout(this.timer)

    // a call still running holds the remote it was made through, which is torn down after
    // this returns. Bounded, because an operation that never returns would outlive any
    // grace period and the interval is over either way
    if (this.firing !== undefined)
      await Promise.race([this.firing, delay(DRAIN)])
  }

  private arm (): void {
    const now = Date.now()

    // a delay past this fires at once rather than late, so a long cycle is waited out in
    // instalments; the wake-up finds the same interval and simply arms again
    const wait = Math.min(this.boundary(now) - now, MAX_DELAY)

    this.timer = setTimeout(() => this.tick(), wait)
    this.timer.unref()
  }

  private tick (): void {
    if (this.closing) return

    const ordinal = this.ordinal(Date.now())

    // a timer may wake a millisecond before the boundary it was set for, and a cycle longer
    // than one timer wakes several times on the way — both are the interval already handled
    if (ordinal !== this.fired) {
      this.fired = ordinal

      void this.fire(ordinal % this.n)
    }

    this.arm()
  }

  /**
   * Nothing queues here. A call still running when the next boundary arrives means the work
   * does not fit the gap, and starting a second one would only make that worse.
   */
  private async fire (i: number): Promise<void> {
    if (this.firing !== undefined) {
      console.warn('Pulse skipped: the previous call has not returned',
        { pulse: this.label, interval: i })

      return
    }

    const owned = this.atom.slots(this.n)

    if (owned === null) {
      console.warn('Pulse skipped: this replica owns nothing',
        { pulse: this.label, interval: i })

      return
    }

    if (!owned.includes(i)) return

    /*
     * A pulse calls and waits, so an operation that raised comes back as an exception here —
     * the runtime carries it across and rethrows it in this process. What to do about one is a
     * choice with no right answer, and asking would put the whole of it in front of anyone who
     * only wanted an operation called every hour. So the interval is skipped: it is reported,
     * and the next one is called as though it had not happened.
     */
    const firing = console.span(this.options,
      async () => await this.local.invoke(this.endpoint, { input: { n: this.n, i } }))
      .catch((error: unknown) => {
        console.error('Pulse failed', { pulse: this.label, interval: i, error })
      })
      .finally(() => { this.firing = undefined })

    this.firing = firing

    await firing
  }
}

export interface Definition {
  locator: Locator
  endpoint: string
  cycle: number
  intervals: number
}

async function delay (ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms).unref())
}

/** `setTimeout` fires immediately past this, so a longer wait is taken in instalments */
const MAX_DELAY = 2 ** 31 - 1

/** how long a call in flight is waited for on close */
const DRAIN = 10_000
