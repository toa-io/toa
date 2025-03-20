import * as schemas from './schemas'
import type { Input as Context } from '../../io'
import type { Directive } from './Directive'
import type { Configuration } from './lib/throttle'

export class Throttle implements Directive {
  private readonly configuration: Configuration

  public constructor (configuration: Configuration) {
    this.configuration = configuration
  }

  public static validate (configuration: unknown): asserts configuration is Configuration {
    schemas.throttle.validate<Permissions>(configuration, 'Incorrect \'io:throttle\' format')
  }

  public preflight (context: Context): void {
    /*
    const quota = this.quotas.get(context)

    if (quota === null)
      throw new Error('Access locked')

    quota.use()
     */
  }

  private getQuota (): void {
    /*
    const quota = new Quota(this.configuration.requests)
    const interval = new Interval(this.configuration.interval)
    const coordinator = new Coordinator(quota, interval, this.configuration.cooldown)

    await interval.tick
    quota.reset()

    return quota
     */
  }
}
