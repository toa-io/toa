import { console } from 'openspan'
import { Connector, entities } from '@toa.io/core'
import { LANES, occurrences, rank } from '@toa.io/definitions/extensions.cadence'
import type { Local } from './Local.ts'
import type { Locator } from '@toa.io/core'
import type { Request } from '@toa.io/core/types'
import type { Occurrences } from '@toa.io/definitions/extensions.cadence'

/**
 * A call to an operation of its own component at the moments its manifest states, as a cron
 * expression.
 *
 * It makes no call. Each occurrence is a delayed call, and what runs here keeps the next one
 * stored: at boot, and each time the one stored comes due. What makes it is what makes every
 * delayed call, so it is made where nothing is running at its moment — which a pulse, storing
 * nothing, cannot offer.
 *
 * Every replica stores every occurrence, and one row is kept: the id is derived from what the
 * occurrence is, so nothing here asks which replica's it is. And nothing here is a chain. An
 * occurrence is a function of the expression and the clock, so one that was not made, or not
 * stored, has no bearing on the one after it.
 */
export class Schedule extends Connector {
  private readonly endpoint: string
  private readonly label: string
  private readonly next: Occurrences

  /** milliseconds a call may be late, or absent where it is owed until the next one is due */
  private readonly overdue?: number

  /** whose occurrence this is: the region the entry names, or the one this deployment is */
  private readonly region: number

  private readonly metronome: Local

  /** the occurrence being waited for, which is the one last handed over */
  private at?: number

  private timer?: NodeJS.Timeout
  private retry?: NodeJS.Timeout
  private closing = false

  /** Whether the process has been told to go quiet, see `stop`. */
  private quiesced = false

  public constructor(definition: Definition, metronome: Local) {
    super()

    const { locator, endpoint, schedule, zone, overdue, region } = definition

    this.endpoint = `${locator.id}.${endpoint}`
    this.label = `${this.endpoint} schedule`
    this.next = occurrences(schedule, zone)
    this.region = region ?? rank()
    this.metronome = metronome

    if (overdue !== undefined) this.overdue = overdue * 1000

    this.depends(metronome)
  }

  protected override async open(): Promise<void> {
    this.tick()
  }

  protected override async close(): Promise<void> {
    this.closing = true

    this.disarm()
  }

  /**
   * Stops storing. What is stored stays stored, and is made when the deployment is working
   * again as any delayed call is; an occurrence that came due unstored while the process was
   * quiet is not made up.
   */
  protected override async pause(): Promise<void> {
    this.quiesced = true

    this.disarm()
  }

  protected override unpause(): void {
    this.quiesced = false
    this.at = undefined

    this.tick()
  }

  private disarm(): void {
    clearTimeout(this.timer)
    clearTimeout(this.retry)
  }

  /**
   * Hands over the next occurrence once the one waited for has come due, and waits again.
   * Always the next one from now and never one already past: whether that one was made is not
   * something this can know.
   */
  private tick(): void {
    if (this.closing || this.quiesced) return

    const now = Date.now()

    // a timer may wake a millisecond before the moment it was set for, and a moment further
    // out than one timer reaches is woken for several times on the way
    let at = this.at

    if (at === undefined || now >= at) {
      const next = this.next(now)

      // an expression whose last moment has passed
      if (next === null) return

      at = this.at = next

      void this.store(at)
    }

    // a delay past this fires at once rather than late, so a long wait is taken in instalments
    this.timer = setTimeout(() => this.tick(), Math.min(at - now, MAX_DELAY))
    this.timer.unref()
  }

  /**
   * The row a delayed call is, found or made under an id that is the occurrence's own — so every
   * replica of the component, and every boot of one, stores the same row.
   *
   * It begins a chain of its own, as what is called from the clock does: no trail is stored.
   */
  private async store(at: number): Promise<void> {
    const id = entities.derive('cadence', this.region, this.endpoint, at)

    const entity = {
      id,
      lane: Math.floor(Math.random() * LANES),
      due: at,
      expires: this.expires(at),
      endpoint: this.endpoint,
      request: { input: { at } }
    }

    try {
      await this.metronome.invoke('ensure', { query: { id }, entity } as Request)
    } catch (error) {
      console.warn('Schedule could not store its next call, and will try again', {
        schedule: this.label,
        at,
        error
      })

      /*
       * Tried again for as long as it is the occurrence being waited for. Past that the next
       * one is handed over instead, and this one is what the readme says may be lost.
       */
      this.retry = setTimeout(() => {
        if (!this.closing && !this.quiesced && this.at === at) void this.store(at)
      }, RETRY)

      this.retry.unref()
    }
  }

  /**
   * Owed until the next occurrence is due where nothing states a bound, so at most one is ever
   * waiting and an outage does not come back as every call it covered.
   */
  private expires(at: number): number {
    if (this.overdue !== undefined) return at + this.overdue

    return this.next(at) ?? Number.MAX_SAFE_INTEGER
  }
}

export interface Definition {
  locator: Locator
  endpoint: string
  schedule: string
  zone: string

  /** seconds */
  overdue?: number
  region?: number
}

/** `setTimeout` fires immediately past this, so a longer wait is taken in instalments */
const MAX_DELAY = 2 ** 31 - 1

/** milliseconds between attempts to store an occurrence the metronome was not there to take */
const RETRY = 5_000
