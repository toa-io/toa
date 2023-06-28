import { Redis, type ClusterOptions } from 'ioredis'
import { Connector, type Locator } from '@toa.io/core'

export class Connection extends Connector {
  public readonly redis: Redis
  private readonly url: string

  public constructor (url: string, locator: Locator) {
    super()

    const keyPrefix = `${locator.namespace}:${locator.name}:`
    const options: ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }

    this.redis = new Redis(url, options)
    this.url = url
  }

  protected override async open (): Promise<void> {
    await this.redis.connect()

    console.log('Stash connected to ' + this.url)
  }

  protected override async close (): Promise<void> {
    this.redis.disconnect()

    console.log('Stash disconnected from ' + this.url)
  }
}
