import { Keys } from './Keys'
import { Quota } from './Quota'
import { Interval } from './Interval'
import type { Configuration } from './Configuration'
import type { Input as Context, Output } from '../../../../io'

export class Quotas {
  private readonly requests: number
  private readonly cooldown: number
  private readonly interval: Interval
  private readonly keys: Keys
  private readonly quotas: Record<string, Quota | undefined> = {}
  private readonly blocked: Record<string, boolean | undefined> = {}

  public constructor (options: Options) {
    this.requests = options.requests
    this.cooldown = options.cooldown
    this.interval = options.interval
    this.keys = options.keys

    this.interval.on('tick', this.reset)
    console.log('Quotas created')
  }

  public static create (configuration: Configuration): Quotas {
    const requests = configuration.requests
    const cooldown = configuration.cooldown
    const keys = Keys.create(configuration.key, configuration.condition)
    const interval = new Interval(configuration.interval)

    return new this({ requests, cooldown, keys, interval })
  }

  public ok (context: Context): boolean {
    const key = this.keys.get(context)

    return this.blocked[key] !== true
  }

  public use (input: Context, output: Output): void {
    const key = this.keys.match(input, output)

    if (key === null)
      return

    this.quotas[key] ??= new Quota(this.requests)

    const ok = this.quotas[key]!.use()

    console.log('Quotas used', Object.keys(this.quotas).length)

    if (!ok)
      this.block(key)
  }

  public dispose (): void {
    this.interval.dispose()
  }

  private readonly reset = (): void => {
    for (const key in this.quotas) {
      const quota = this.quotas[key]!

      if (quota.idle)
        delete this.quotas[key]
      else
        quota.reset()
    }
  }

  private block (key: string): void {
    this.blocked[key] = true

    setTimeout(() => delete this.blocked[key], this.cooldown)
  }
}

interface Options {
  keys: Keys
  requests: number
  cooldown: number
  interval: Interval
}
