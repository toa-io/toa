'use strict'

const { Redis, Cluster } = require('ioredis')
const { console } = require('openspan')
const { Connector } = require('@toa.io/core')

/**
 * One client per process. Every group registers in the same Redis under a key of its own, so
 * a composition of five components opens one connection between them.
 */
class Connection extends Connector {
  /** @type {import('ioredis').Redis} */
  redis

  async open () {
    const urls = resolve()

    if (urls.length === 0) return

    /*
     * More than one address is a cluster, which is a matter of fitting into a deployment
     * rather than of scale: there is nothing here to shard, but a cluster cannot be reached
     * with a plain client, and one that already exists is what an operator has to point at.
     * A group's keys carry a hash tag, so they never go cross-slot.
     */
    this.redis = urls.length === 1
      ? new Redis(urls[0], OPTIONS)
      : new Cluster(urls, { redisOptions: OPTIONS })

    /*
     * Connecting is not awaited, and a failure to connect is not an error here. Coordination
     * that cannot be reached must read exactly as coordination that was never configured —
     * nothing is owned, and whoever asked stands down — and a process that could not start
     * because of it would be the opposite of that. The client retries on its own, so a Redis
     * that comes up later is picked up without anything being restarted.
     */
    // ioredis leaves `message` empty on a refused connection, where the code is the whole story
    this.redis.on('error', (error) =>
      console.warn('Atomicity is unreachable, so nothing is owned',
        { error: error.code ?? error.message }))

    console.info('Atomicity connecting to redis', { nodes: urls.length })
  }

  async close () {
    this.redis?.disconnect()
  }
}

const OPTIONS = { enableReadyCheck: true }

function resolve () {
  const value = process.env[VARIABLE]

  if (value === undefined || value === '') return []

  return value.split(' ').filter((url) => url !== '')
}

let instance

/** the connection is shared by every group of the process */
const connection = () => (instance ??= new Connection())

/** @internal for tests */
const reset = () => (instance = undefined)

const VARIABLE = 'TOA_ATOMICITY_REDIS'

exports.Connection = Connection
exports.connection = connection
exports.reset = reset
exports.VARIABLE = VARIABLE
