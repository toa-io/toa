import { Redis, type ClusterOptions } from 'ioredis'
import { Connector, type Locator } from '@toa.io/core'

export class Connection extends Connector {
  public readonly redis: Redis

  public constructor (url: string, locator: Locator) {
    super()

    const keyPrefix = `${locator.namespace}:${locator.name}:`
    const options: ClusterOptions = { keyPrefix, enableReadyCheck: true }

    this.redis = new Redis(url, options)
    this.logging()
  }

  protected override async open (): Promise<void> {
    console.log(this.redis.status)
    // await this.cluster.connect()
  }

  protected override async close (): Promise<void> {
    this.redis.disconnect()
  }

  private logging (): void {
    this.redis.on('connect', () => {
      console.log('Connected to Redis')
    })

    this.redis.on('error', (e) => {
      console.log('Redis connection error', e)
    })

    this.redis.on('ready', () => {
      console.log('Redis connection is ready')
    })

    this.redis.on('close', () => {
      console.log('Redis connection is closed')
    })
  }
}
