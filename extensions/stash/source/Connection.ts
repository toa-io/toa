import { Redis, type ClusterOptions } from 'ioredis'
import { Connector, type Locator } from '@toa.io/core'
import { resolve } from '@toa.io/pointer'
import { ID } from './extension'

export class Connection extends Connector {
  public readonly redises: Redis[] = []
  private readonly locator: Locator

  public constructor (locator: Locator) {
    super()

    this.locator = locator
  }

  protected override async open (): Promise<void> {
    const keyPrefix = `${this.locator.namespace}:${this.locator.name}:`
    const options: ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }
    const urls = await this.resolveURLs()

    for (const url of urls)
      this.redises.push(new Redis(url, options))

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

    console.log(`Stash connected to ${redis.options.host}:${String(redis.options.port)}`)
  }

  private async resolveURLs (): Promise<string[]> {
    if (process.env.TOA_DEV === '1')
      return ['redis://localhost']
    else
      return resolve(ID, this.locator.id)
  }
}
