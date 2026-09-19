import { Redis } from 'ioredis'
import { environment } from '@toa.io/generic'
import { EXPIRE, STREAMS } from '@toa.io/definitions/extensions.exposition/realtime'

/**
 * The Redis the streams are kept in, as the components that write them and the gateway that reads
 * them both reach it: the addresses the `realtime` annotation names, one connection to each. A
 * key is kept by the one its hash falls to, so every process finds it on the same one.
 */
export class Shards {
  public readonly connections: Redis[]

  public constructor() {
    // a key's, and its channel's: the prefix applies to a sharded channel as to a key
    const keyPrefix = prefix()

    this.connections = addresses().map(
      (address) => new Redis(address, { keyPrefix, lazyConnect: true })
    )
  }

  /** The connection a key is kept on. */
  public of(key: string): Redis {
    return this.connections[shard(key, this.connections.length)]
  }

  public async connect(): Promise<void> {
    await Promise.all(
      this.connections.map(async (connection) => await connection.connect())
    )
  }

  public disconnect(): void {
    for (const connection of this.connections) connection.disconnect()
  }
}

/** Whether the streams have anywhere to be kept: the `realtime` annotation names it. */
export function configured(): boolean {
  return environment.get('TOA_DEV') === '1' || environment.has(STREAMS)
}

/** What a key is stored and published under: the scope, so contexts sharing a Redis do not meet. */
export function prefix(): string {
  return `${environment.scope()}:realtime:`
}

/** Seconds a stream outlives its last reader: the window a reader reconnects in. */
export function expire(): number {
  const value = Number(environment.get(EXPIRE))

  return Number.isNaN(value) || value <= 0 ? DEFAULT_EXPIRE : value
}

/**
 * FNV-1a over the key's UTF-16 code units: the same number in every process, and cheap enough to
 * take for every event.
 */
export function shard(key: string, n: number): number {
  if (n === 1) return 0

  let hash = 0x811c9dc5

  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0) % n
}

function addresses(): string[] {
  const value = environment.get(STREAMS)

  // Toa's own development stack is not on the conventional ports. See CONTRIBUTING.md.
  if (value === undefined && environment.get('TOA_DEV') === '1')
    return ['redis://localhost:31040']

  if (value === undefined)
    throw new Error(`${STREAMS} is not set: the context has no realtime`)

  return value.split(' ').filter(Boolean)
}

/**
 * Appends an event to the streams of its keys, and publishes it on their channels — only to a
 * stream that exists, which is one that is consumed. One call per Redis, whatever the keys it
 * keeps: they are all on it.
 *
 * `KEYS` are the streams; `ARGV` is the event, its payload as JSON, and the length a stream is
 * trimmed to. What is published is `[id, event, data]`, `data` the JSON it was given.
 */
export const APPEND = `
for _, key in ipairs(KEYS) do
  if redis.call('EXISTS', key) == 1 then
    local id = redis.call('XADD', key, 'MAXLEN', '~', ARGV[3], '*', 'type', ARGV[1], 'data', ARGV[2])
    redis.call('SPUBLISH', key, cjson.encode({ id, ARGV[1], ARGV[2] }))
  end
end
`

/** How many entries a stream keeps: what a reader that reconnects can be given at most. */
export const MAXLEN = 1000

const DEFAULT_EXPIRE = 300
