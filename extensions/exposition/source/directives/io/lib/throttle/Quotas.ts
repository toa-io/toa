import { Keys } from './Keys'
import type { Batch } from './Sync'
import type { Configuration } from './Configuration'
import type { Parameter } from '../../../../RTD'
import type { Input as Context, Output } from '../../../../io'

/**
 * A quota per key, metered by GCRA, decided in this process and shared with the others.
 *
 * The state of a key is one theoretical arrival time: the moment the key would be back
 * at zero if nothing more arrived. An admitted request pushes it `emission` further out,
 * time drags it back, and a request is admitted while it stays within `capacity` of now.
 * So `requests` is what a key may spend at once, and `requests / interval` what it earns
 * back — no window to burst across the edge of, and no lockout to time out of.
 *
 * Deciding needs nothing but the local map, which is what keeps the request path free of
 * I/O. What the other gateways have spent arrives on {@link Sync}'s tick, as a debt in
 * milliseconds — a duration, so it carries across processes without their clocks having
 * to agree, and additive, which is what lets each process report only its own increments.
 */
export class Quotas {
  /** How often the debt is worth reconciling with the other gateways, in milliseconds. */
  public readonly period: number

  /** Milliseconds of debt an admitted request adds, `interval / requests`. */
  private readonly emission: number

  /** Debt a key may carry before it is refused, `interval` — a burst of `requests`. */
  private readonly capacity: number

  private readonly keys: Keys
  private readonly prefix: string
  private readonly conditional: boolean
  private readonly entries = new Map<string, Entry>()

  /**
   * The key computed at preflight, for settle to charge against.
   *
   * `segment` reads the route parameters, which settle is not given, and `identity`
   * can be refreshed between the two — so recomputing there would key a request
   * differently than it was checked, and throttling would quietly stop working.
   */
  private readonly keyed = new WeakMap<Context, string>()

  public constructor (options: Options) {
    this.keys = options.keys
    this.conditional = options.conditional
    this.emission = options.interval / options.requests
    this.capacity = options.interval
    this.period = period(options.interval)

    // a key means one budget, so quotas that do not share one must not share a key
    this.prefix = `t:${options.requests}:${options.interval}:`
  }

  public static create (configuration: Configuration, route: string = ''): Quotas {
    const { requests, interval, condition } = configuration
    const keys = Keys.create(configuration.key, condition, route)

    return new this({ keys, requests, interval, conditional: condition !== undefined })
  }

  /**
   * Seconds to wait before the request would be admitted, or zero when it is.
   *
   * Charges here when nothing conditions the count, so that the request is metered by
   * the same call that admits it; otherwise only the response can tell whether it counts,
   * and {@link use} charges once it can.
   */
  public check (context: Context, parameters: Parameter[]): number {
    const key = this.keys.get(context, parameters)

    this.keyed.set(context, key)

    const now = Date.now()
    const entry = this.entries.get(key)
    const tat = Math.max(entry?.tat ?? now, now)
    const admit = tat + this.emission - this.capacity

    if (admit > now)
      return Math.ceil((admit - now) / 1000)

    if (!this.conditional)
      this.charge(key, entry, tat)

    return 0
  }

  /** Charges what the condition accepts, once the response can be matched against it. */
  public use (input: Context, output: Output): void {
    if (!this.conditional || !this.keys.matches(input, output))
      return

    // preflight always runs first, and a request it refuses never reaches settle
    const key = this.keyed.get(input) ?? this.keys.get(input)
    const now = Date.now()
    const entry = this.entries.get(key)
    const tat = Math.max(entry?.tat ?? now, now)

    this.charge(key, entry, tat)
  }

  /**
   * Adds what is worth reporting to the batch, and drops what has gone quiet.
   *
   * The debt is not cleared here but in {@link settled}, so a tick that fails to reach
   * Redis leaves it to be reported by the next one instead of losing it.
   */
  public flush (now: number, batch: Batch[]): void {
    for (const [key, entry] of this.entries) {
      const delta = Math.round(entry.debt)

      if (delta > 0) {
        batch.push({ quotas: this, key, delta })

        continue
      }

      // out of debt and with nothing left to report, a key says no more than an absent one
      if (entry.tat <= now)
        this.entries.delete(key)
    }
  }

  /** Takes the group's debt back, and clears what this process contributed to it. */
  public settled (reported: Batch, debt: number, now: number): void {
    const entry = this.entries.get(reported.key)

    if (entry === undefined) {
      if (debt > 0)
        this.entries.set(reported.key, { tat: now + debt, debt: 0 })

      return
    }

    entry.debt -= reported.delta

    // the group has spent at least what this process has, so its debt is the one to keep
    entry.tat = Math.max(entry.tat, now + debt)
  }

  public name (key: string): string {
    return this.prefix + key
  }

  private charge (key: string, entry: Entry | undefined, tat: number): void {
    if (entry === undefined)
      this.entries.set(key, { tat: tat + this.emission, debt: this.emission })
    else {
      entry.tat = tat + this.emission
      entry.debt += this.emission
    }
  }
}

/**
 * How often to reconcile, in milliseconds.
 *
 * Reconciling is what bounds the overshoot — between two ticks a gateway is going on
 * what it alone has spent — so it is worth doing an order of magnitude more often than
 * the interval, within reason on either end.
 */
function period (interval: number): number {
  return Math.min(Math.max(interval / 10, MIN_PERIOD), MAX_PERIOD)
}

const MIN_PERIOD = 250
const MAX_PERIOD = 2000

interface Entry {
  /** Theoretical arrival time: when the key is back at zero if nothing more arrives. */
  tat: number

  /** Milliseconds of debt this process has added and not yet reported. */
  debt: number
}

interface Options {
  keys: Keys
  requests: number
  interval: number
  conditional: boolean
}
