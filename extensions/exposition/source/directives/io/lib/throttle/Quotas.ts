import { console } from 'openspan'
import { Keys } from './Keys'
import type { Remote } from '@toa.io/core'
import type { Configuration } from './Configuration'
import type { Parameter } from '../../../../RTD'
import type { Input as Context, Output } from '../../../../io'

/**
 * Quota usage counted across every gateway process, and blocking decided in this one.
 *
 * The count comes from the `exposition.stash` component, which counts through Redis
 * and hands back a lower bound on what the whole group has reached. Blocking stays
 * local: every process sees the same number and reaches the same conclusion on its
 * own, and a process that cannot reach Redis still enforces what it has seen itself.
 */
export class Quotas {
  private readonly requests: number
  private readonly interval: number
  private readonly cooldown: number
  private readonly keys: Keys
  private readonly counter: Promise<Remote>
  private readonly blocked: Record<string, boolean | undefined> = {}
  private readonly timers = new Set<NodeJS.Timeout>()

  /**
   * The key computed at preflight, for settle to count against.
   *
   * `segment` reads the route parameters, which settle is not given, and `identity`
   * can be refreshed between the two — so recomputing there would key a request
   * differently than it was checked, and blocking would quietly stop working.
   */
  private readonly keyed = new WeakMap<Context, string>()
  private remote: Remote | null = null

  public constructor (options: Options) {
    this.requests = options.requests
    this.interval = options.interval
    this.cooldown = options.cooldown
    this.keys = options.keys
    this.counter = options.counter
  }

  public static create (configuration: Configuration, counter: Promise<Remote>,
    route: string = ''): Quotas {
    const { requests, interval, cooldown } = configuration
    const keys = Keys.create(configuration.key, configuration.condition, route)

    return new this({ requests, interval, cooldown, keys, counter })
  }

  public ok (context: Context, parameters: Parameter[]): boolean {
    const key = this.keys.get(context, parameters)

    this.keyed.set(context, key)

    return this.blocked[key] !== true
  }

  public async use (input: Context, output: Output): Promise<void> {
    if (!this.keys.matches(input, output))
      return

    // preflight always runs first, and a request it throws on never reaches settle
    const key = this.keyed.get(input) ?? this.keys.get(input)

    this.remote ??= await this.counter

    const count = await this.remote.invoke<number>('count',
      { input: { name: key, interval: this.interval, amount: 1 } })

    if (count >= this.requests)
      this.block(key)
  }

  public dispose (): void {
    for (const timer of this.timers)
      clearTimeout(timer)

    this.timers.clear()
  }

  private block (key: string): void {
    if (this.blocked[key] === true)
      return

    this.blocked[key] = true

    const timer = setTimeout(() => {
      delete this.blocked[key]

      this.timers.delete(timer)
    }, this.cooldown)

    timer.unref()
    this.timers.add(timer)

    console.info('Quota exceeded, key blocked', { key, cooldown: this.cooldown })
  }
}

interface Options {
  keys: Keys
  requests: number
  interval: number
  cooldown: number
  counter: Promise<Remote>
}
