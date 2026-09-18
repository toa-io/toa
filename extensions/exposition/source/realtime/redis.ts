import { Redis, type RedisOptions } from 'ioredis'
import { resolve } from '@toa.io/pointer'
import { environment } from '@toa.io/generic'
import { STREAMS } from '@toa.io/definitions/extensions.exposition/realtime'

/**
 * The Redis the streams are in, as the gateway that reads them and the components that write them
 * both resolve it: the address the `stash` annotation gives `realtime.streams`, and its prefix.
 */
export function connect(options: RedisOptions = {}): Redis {
  return new Redis(url(), { lazyConnect: true, ...options })
}

/** What a key is stored and published under. */
export function prefix(): string {
  return `${environment.scope()}:${STREAMS.replace('.', ':')}:`
}

function url(): string {
  // Toa's own development stack is not on the conventional ports. See CONTRIBUTING.md.
  if (environment.get('TOA_DEV') === '1') return 'redis://localhost:31040'

  return resolve('stash', STREAMS)[0]
}

/**
 * Appends an event to the streams of its keys, and publishes it on their channels — only to a
 * stream that exists, which is one that is consumed. One call per event, whatever its keys.
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

/** How many entries a stream keeps: what a client that reconnects can be given at most. */
export const MAXLEN = 1000

/** Seconds a stream outlives its last reader: the window a client reconnects in. */
export function expire(): number {
  const value = Number(environment.get('TOA_REALTIME_EXPIRE'))

  return Number.isNaN(value) || value <= 0 ? EXPIRE : value
}

const EXPIRE = 300
