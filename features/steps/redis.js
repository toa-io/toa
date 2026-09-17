import assert from 'node:assert'
import { Then } from '@cucumber/cucumber'
import { Redis } from 'ioredis'

Then(
  'Redis holds {string} under {string}',
  /**
   * Read with a client of its own and no prefix, so the key is the one the server holds.
   *
   * @param {string} value
   * @param {string} key
   */
  async function (value, key) {
    await using(async (redis) => {
      assert.equal(await redis.get(key), value, `'${key}' does not hold '${value}'`)
    })
  }
)

Then(
  'Redis holds a key matching {string}',
  /**
   * A registration is renewed every interval and outlives a few of them, so it is looked for
   * until it has had time to be written.
   *
   * @param {string} pattern
   */
  async function (pattern) {
    await using(async (redis) => {
      const deadline = Date.now() + WAITING

      do {
        let cursor = '0'

        do {
          const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 1000)

          if (keys.length > 0) return

          cursor = next
        } while (cursor !== '0')

        await new Promise((resolve) => setTimeout(resolve, 100))
      } while (Date.now() < deadline)

      assert.fail(`no key matches '${pattern}'`)
    })
  }
)

/**
 * @param {(redis: Redis) => Promise<void>} fn
 */
async function using(fn) {
  const redis = new Redis(URL, { lazyConnect: true })

  await redis.connect()

  try {
    await fn(redis)
  } finally {
    redis.disconnect()
  }
}

/** the Redis a process under `TOA_DEV=1` uses, for the stash and for atomicity alike */
const URL = 'redis://localhost:31040'

/** how long a key a replica writes on its own schedule may take to appear */
const WAITING = 3000
