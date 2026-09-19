import { Redis, type RedisOptions } from 'ioredis'
import { console } from 'openspan'
import { Connector, type Locator } from '@toa.io/core'
import { resolve } from '@toa.io/pointer'
import { ID } from '@toa.io/definitions/extensions.stash'
import { environment } from '@toa.io/generic'

export class Connection extends Connector {
  public redis: Redis | null = null
  public readonly locator: Locator

  public constructor(locator: Locator) {
    super()

    this.locator = locator
  }

  protected override async open(): Promise<void> {
    // contexts share a Redis, and so do the processes of one context given different suffixes
    const keyPrefix = `${environment.scope()}:${this.locator.namespace}:${this.locator.name}:`

    const options: RedisOptions = {
      keyPrefix,
      enableReadyCheck: true,
      lazyConnect: true,
      protocol: 3,
      replyMapping: 'resp3'
    }

    const redis = new Redis(await this.resolveURL(), options)

    this.redis = redis
    this.watch(redis)

    await redis.connect()

    console.info('Stash connected to redis', { host: this.redis.options.host })
  }

  /**
   * The client reconnects on its own and reports every attempt that fails, so an outage is said
   * once, and so is its end. A client with nothing listening for its errors prints each of them
   * past the logs, as unhandled.
   */
  private watch(redis: Redis): void {
    let lost = false

    // ioredis leaves `message` empty on a refused connection, where the code is the whole story
    redis.on('error', (error: NodeJS.ErrnoException) => {
      if (lost) return

      lost = true

      console.warn('Stash is unreachable', {
        host: redis.options.host,
        error: error.code ?? error.message
      })
    })

    redis.on('ready', () => {
      if (!lost) return

      lost = false

      console.info('Stash reconnected', { host: redis.options.host })
    })
  }

  protected override async close(): Promise<void> {
    this.redis?.disconnect()
    this.redis = null

    console.info('Stash shutdown complete')
  }

  private async resolveURL(): Promise<string> {
    // Toa's own development stack is not on the conventional ports: the applications built on
    // Toa are, and they share the machine. See CONTRIBUTING.md.
    if (environment.get('TOA_DEV') === '1') return 'redis://localhost:31040'

    const urls = resolve(ID, this.locator.id)

    // several addresses used to be independent masters for the lock manager, which the atom
    // aspect holds now. A cache is one Redis, and the rest have never been read from
    if (urls.length > 1)
      console.warn('Stash takes the first of several addresses', { count: urls.length })

    return urls[0]
  }
}
