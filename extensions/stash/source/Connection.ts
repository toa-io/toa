import { Redis, type ClusterOptions } from 'ioredis'
import { Connector, type Locator } from '@toa.io/core'

export class Connection extends Connector {
  public readonly redis: Redis

  public constructor (url: string, locator: Locator) {
    super()

    const keyPrefix = `${locator.namespace}:${locator.name}:`
    const options: ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }

    this.redis = new Redis(url, options)
  }

  protected override async open (): Promise<void> {
    await this.redis.connect()
  }

  protected override async close (): Promise<void> {
    this.redis.disconnect()
  }
}
