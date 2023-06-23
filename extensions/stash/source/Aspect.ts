import Redlock from 'redlock'
import { encode, decode } from 'msgpackr'
import { Connector, type extensions } from '@toa.io/core'
import type { Connection } from './Connection'
import type { Redis } from 'ioredis'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'stash'
  private readonly redis: Redis
  private readonly redlock: Redlock

  public constructor (connection: Connection) {
    super()

    this.redis = connection.redis
    this.redlock = new Redlock([this.redis])

    this.depends(connection)
  }

  public async invoke (method: 'store', key: string, value: object): Promise<void>
  public async invoke (method: 'fetch', key: string): Promise<object>
  public async invoke (method: 'lock', key: string | string[], routine: Routine): Promise<void>
  public async invoke (method: string, ...args: unknown[]): Promise<any>
  public async invoke (method: string, ...args: unknown[]): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (typeof this.redis[method] === 'function') return this.redis[method](...args)

    if (method === 'store') await this.store(args[0] as string, args[1] as object, ...args.slice(2))

    if (method === 'fetch') return await this.fetch(args[0] as string)

    if (method === 'lock') await this.lock(args[0] as string, args[1] as () => Promise<void>)
  }

  private async store (key: string, value: object, ...args: unknown[]): Promise<void> {
    const buffer = encode(value)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await this.redis.set(key, buffer, ...args)
  }

  private async fetch (key: string): Promise<object | null> {
    const buffer = await this.redis.getBuffer(key)

    return buffer === null ? null : decode(buffer)
  }

  private async lock (key: string | string[], routine: Routine): Promise<void> {
    if (typeof key === 'string') key = [key]

    await this.redlock.using(key, 5000, routine)
  }
}

type Routine = () => Promise<void>
