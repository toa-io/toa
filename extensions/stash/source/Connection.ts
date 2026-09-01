import { Redis, type RedisOptions } from 'ioredis'
import { console } from 'openspan'
import { Connector, type Locator } from '@toa.io/core'
import { resolve } from '@toa.io/pointer'
import { ID } from './extension'

export class Connection extends Connector {
  public redis: Redis | null = null
  public readonly locator: Locator

  public constructor (locator: Locator) {
    super()

    this.locator = locator
  }

  protected override async open (): Promise<void> {
    const keyPrefix = `${this.locator.namespace}:${this.locator.name}:`

    const options: RedisOptions = {
      keyPrefix,
      enableReadyCheck: true,
      lazyConnect: true,
      protocol: 3,
      replyMapping: 'resp3'
    }

    this.redis = new Redis(await this.resolveURL(), options)

    await this.redis.connect()

    console.info('Stash connected to redis', { host: this.redis.options.host })
  }

  protected override async close (): Promise<void> {
    this.redis?.disconnect()
    this.redis = null

    console.info('Stash shutdown complete')
  }

  private async resolveURL (): Promise<string> {
    if (process.env.TOA_DEV === '1')
      return 'redis://localhost'

    const urls = resolve(ID, this.locator.id)

    // several addresses used to be independent masters for the lock manager, which the atom
    // aspect holds now. A cache is one Redis, and the rest have never been read from
    if (urls.length > 1)
      console.warn('Stash takes the first of several addresses', { count: urls.length })

    return urls[0]
  }
}
