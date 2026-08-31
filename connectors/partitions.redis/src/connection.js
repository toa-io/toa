'use strict'

const { Redis } = require('ioredis')
const { console } = require('openspan')
const { Connector } = require('@toa.io/core')

/**
 * One client per process. Every component in a composition registers in the same Redis, under
 * its own group key, so five components open one connection between them.
 */
class Connection extends Connector {
  /** @type {import('ioredis').Redis} */
  redis

  async open () {
    const urls = resolve()

    if (urls.length === 0) return

    // one node is enough: the counters are per group and a group lives in one slot
    this.redis = new Redis(urls[0], { lazyConnect: true, enableReadyCheck: true })

    await this.redis.connect()

    console.info('Outbox partitioning connected to redis', { host: this.redis.options.host })
  }

  async close () {
    this.redis?.disconnect()
  }
}

function resolve () {
  const value = process.env[VARIABLE]

  if (value === undefined || value === '') return []

  return value.split(' ').filter((url) => url !== '')
}

let instance

/** the connection is shared by every component of the process */
const connection = () => (instance ??= new Connection())

/** @internal for tests */
const reset = () => (instance = undefined)

const VARIABLE = 'TOA_OUTBOX_REDIS'

exports.Connection = Connection
exports.connection = connection
exports.reset = reset
exports.VARIABLE = VARIABLE
