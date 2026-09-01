/* eslint-disable @typescript-eslint/no-floating-promises */
import { Redlock } from '@sesamecare-oss/redlock'
import { encode, decode } from 'msgpackr'
import { console, type SpanOptions } from 'openspan'
import { Connector, type extensions } from '@toa.io/core'
import type { Connection } from './Connection'
import type { Redis, ChainableCommander } from 'ioredis'

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

  public invoke (method: 'store', key: string, value: object): any
  public invoke (method: 'fetch', key: string): any
  public invoke<T> (method: 'lock', key: Resources, routine: Routine<T>): any
  public invoke (method: string, ...args: unknown[]): any
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  public invoke (method: string, ...args: unknown[]): any {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (typeof this.redis[method] === 'function') {
      // multi/pipeline return a sync chainable; the span wraps exec() instead
      if (method === 'multi' || method === 'pipeline') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const chain: ChainableCommander = this.redis[method](...args)
        const exec = chain.exec.bind(chain)

        chain.exec = async () => {
          const options = span(method, args[0])

          Object.assign(options.attributes!, { 'db.operation.batch.size': chain.length })

          return await console.span(options, exec)
        }

        return chain
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return console.span(span(method, args[0]), () => this.redis[method](...args))
    }

    if (method === 'store')
      console.span(span(method, args[0]),
        async () => { await this.store(args[0] as string, args[1] as object, ...args.slice(2)) })

    if (method === 'fetch')
      return console.span(span(method, args[0]), async () => await this.fetch(args[0] as string))

    if (method === 'lock')
      return console.span(span(method, args[0]),
        async () => await this.lock(args[0] as Resources, args[1] as () => any))
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

  private async lock<T>(key: Resources, routine: Routine<T>): Promise<T | null> {
    if (this.redlock === null) return null

    if (typeof key === 'string') key = [key]

    return await this.redlock.using<T>(key, 5000, routine)
  }
}

function span (method: string, key: unknown): SpanOptions {
  // https://opentelemetry.io/docs/specs/semconv/database/redis/
  // `db.namespace` names the database node on service graphs,
  // which otherwise displays 'unknown'
  const attributes: Record<string, unknown> = {
    'db.system': 'redis',
    'db.namespace': 'stash',
    'db.operation.name': method
  }

  if (typeof key === 'string')
    attributes.key = key
  else if (Array.isArray(key))
    attributes.key = key.join(' ')

  return { name: `${method} stash`, kind: 'client', attributes }
}

type Routine<T> = () => Promise<T>
type Resources = string | string[]
