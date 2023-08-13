import Redlock from 'redlock-temp-fix'
import { encode, decode } from 'msgpackr'
import { Connector, type extensions } from '@toa.io/core'
import type { Connection } from './Connection'
import type { Redis } from 'ioredis'

export class Aspect extends Connector implements extensions.Aspect {
  public readonly name = 'stash'
  private readonly connection: Connection
  private redis: Redis | null = null
  private redlock: Redlock | null = null

  public constructor (connection: Connection) {
    super()

    this.connection = connection
    this.depends(connection)
  }

  public async invoke (method: 'store', key: string, value: object): Promise<void>
  public async invoke (method: 'fetch', key: string): Promise<object>
  public async invoke<T> (method: 'lock', key: Resources, routine: Routine<T>): Promise<T>
  public async invoke (method: string, ...args: unknown[]): Promise<any>
  public async invoke (method: string, ...args: unknown[]): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (typeof this.redis[method] === 'function') return this.redis[method](...args)

    if (method === 'store')
      await this.store(args[0] as string, args[1] as object, ...args.slice(2))

    if (method === 'fetch')
      return await this.fetch(args[0] as string)

    if (method === 'lock')
      return await this.lock(args[0] as Resources, args[1] as () => any)
  }

  protected override async open (): Promise<void> {
    this.redis = this.connection.redises[0]
    this.redlock = new Redlock(this.connection.redises, { retryCount: -1 })
  }

  private async store (key: string, value: object, ...args: unknown[]): Promise<void> {
    const buffer = encode(value)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await this.redis.set(key, buffer, ...args)
  }

  private async fetch (key: string): Promise<object | null> {
    if (this.redis === null) return null

    const buffer = await this.redis.getBuffer(key)

    return buffer === null ? null : decode(buffer)
  }

  private async lock<T> (key: Resources, routine: Routine<T>): Promise<T | null> {
    if (this.redlock === null) return null

    if (typeof key === 'string') key = [key]

    return await this.redlock.using<T>(key, 5000, routine)
  }
}

type Routine<T> = () => Promise<T>
type Resources = string | string[]
