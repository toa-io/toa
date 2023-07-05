import { Redis, type ClusterOptions } from 'ioredis'
import { Connector, type Locator } from '@toa.io/core'

export class Connection extends Connector {
  public readonly redises: Redis[]

  public constructor (urls: string[], locator: Locator) {
    super()

    const keyPrefix = `${locator.namespace}:${locator.name}:`
    const options: ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }

    this.redises = urls.map((url) => new Redis(url, options))
  }

  protected override async open (): Promise<void> {
    const connecting = this.redises.map(this.connectNode.bind(this))

    await Promise.all(connecting)
  }

  protected override async close (): Promise<void> {
    for (const redis of this.redises)
      redis.disconnect()

    console.log('Stash disconnected')
  }

  private async connectNode (redis: Redis): Promise<void> {
    await redis.connect()

    console.log(`Stash connected to ${redis.options.host as string}:${String(redis.options.port)}`)
  }
}
