import { counter, type Console as Reporter, type Increment } from 'comcount'
import { console } from 'openspan'
import type { Redis } from 'ioredis'

/**
 * Counters shared with every other process counting under the same name.
 *
 * One `comcount` counter per name and interval, created on first use. Each costs
 * a timer and a round trip an interval for as long as it is kept, and throttling
 * by IP mints one per address — so they are not kept forever.
 */
export class Counters {
  private readonly redis: Redis
  private readonly counters = new Map<string, Entry>()
  private sweeper: NodeJS.Timeout | null = null

  public constructor (redis: Redis) {
    this.redis = redis
  }

  public count (name: string, interval: number, amount?: number): number {
    const key = `${interval}:${name}`
    let entry = this.counters.get(key)

    if (entry === undefined) {
      const increment = counter({ redis: this.redis, name, interval, console: REPORTER })

      entry = { increment, interval, touched: 0 }

      this.counters.set(key, entry)
      this.sweeper ??= setInterval(this.sweep, SWEEP).unref()
    }

    entry.touched = Date.now()

    return entry.increment(amount)
  }

  public close (): void {
    if (this.sweeper !== null) {
      clearInterval(this.sweeper)

      this.sweeper = null
    }

    for (const entry of this.counters.values())
      entry.increment.close()

    this.counters.clear()
  }

  /** Drops what has gone quiet for longer than its keys in Redis survive anyway. */
  private readonly sweep = (): void => {
    const now = Date.now()

    for (const [key, entry] of this.counters)
      if (now - entry.touched > entry.interval * KEEP) {
        entry.increment.close()

        this.counters.delete(key)
      }
  }
}

interface Entry {
  increment: Increment
  interval: number
  touched: number
}

/**
 * openspan keeps `trace` for spans, so what comcount would trace is written as
 * `debug`; the rest of the levels map straight across.
 */
const REPORTER: Reporter = {
  trace: (message, attributes) => { console.debug(message, attributes) },
  debug: (message, attributes) => { console.debug(message, attributes) },
  info: (message, attributes) => { console.info(message, attributes) },
  warn: (message, attributes) => { console.warn(message, attributes) },
  error: (message, attributes) => { console.error(message, attributes) }
}

/** Intervals an idle counter is kept for, matching comcount's own key expiry. */
const KEEP = 3

/** How often idle counters are looked for, in milliseconds. */
const SWEEP = 1000
