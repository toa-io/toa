import type { Redis } from 'ioredis'

/**
 * Debt shared with every other process metering under the same key.
 *
 * A key holds one number: the milliseconds of debt everyone metering it has run up
 * between them. Debt drains at a millisecond a millisecond and grows by what each
 * process reports, so it is additive — which is what lets a process report only its
 * own increments, on its own schedule, and still read back where the group stands.
 *
 * The clock is Redis' own, so the processes reporting need not agree on the time, and
 * what comes back is a duration rather than a moment, so neither does the caller.
 *
 * A whole batch is metered by one script, because the callers are rate limiters and
 * the number of keys they watch is the number of clients they are watching for.
 */
export class Meter {
  private readonly redis: Redis

  public constructor (redis: Redis) {
    this.redis = redis

    redis.defineCommand(COMMAND, { lua: SCRIPT })
  }

  /** Adds each delta to its key, and answers what the group has reached. */
  public async meter (keys: string[], deltas: number[]): Promise<number[]> {
    if (keys.length <= CHUNK)
      return await this.call(keys, deltas)

    // arguments are spread into the call, so a batch is split rather than risking the
    // engine's limit on how many there may be
    const debts: number[] = []

    for (let i = 0; i < keys.length; i += CHUNK)
      debts.push(...await this.call(keys.slice(i, i + CHUNK), deltas.slice(i, i + CHUNK)))

    return debts
  }

  private async call (keys: string[], deltas: number[]): Promise<number[]> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error `defineCommand` extends the client at runtime
    return await this.redis[COMMAND](keys.length, ...keys, ...deltas)
  }
}

const COMMAND = 'meter'

/** How long a key outlives the debt on it, in milliseconds. */
const GRACE = 10_000

/** Keys per call, bounding how many arguments are spread into one. */
const CHUNK = 2000

const SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local debts = {}

for i = 1, #KEYS do
  local key = KEYS[i]
  local state = redis.call('HMGET', key, 'd', 'a')
  local debt = tonumber(state[1]) or 0
  local at = tonumber(state[2]) or now

  debt = math.max(0, debt - (now - at)) + tonumber(ARGV[i])

  redis.call('HSET', key, 'd', debt, 'a', now)
  redis.call('PEXPIRE', key, debt + ${GRACE})

  debts[i] = debt
end

return debts
`
