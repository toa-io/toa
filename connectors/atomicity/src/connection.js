'use strict'

const { Redlock } = require('@sesamecare-oss/redlock')
const { Redis } = require('ioredis')
const { console } = require('openspan')
const { Connector } = require('@toa.io/core')
const { Meter } = require('./meter')

/**
 * One client per process, shared by every atom in it. Each keeps its own keys, so a composition
 * of five components opens one connection between them however much they decide.
 */
class Connection extends Connector {
  /** @type {import('ioredis').Redis} */
  redis

  /** @type {Meter} */
  meter

  /** @type {Redlock} */
  redlock

  async open () {
    const url = resolve()

    if (url === undefined) {
      console.warn('Atomicity is not configured, so nothing is owned and nothing is metered. ' +
        'Set TOA_ATOMICITY_REDIS.')

      return
    }

    this.redis = new Redis(url, OPTIONS)

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

    // one script per process, whatever the groups sharing this client meter under
    this.meter = new Meter(this.redis)

    /*
     * One client, where Redlock is written for a quorum of independent masters. A quorum
     * would need a second and a third Redis that the rest of this connector cannot use —
     * a registry counts replicas on one key and a meter accumulates on one key, and both
     * would split across masters. What the library is used for is the acquisition: a safe
     * release, a lease extended for as long as the routine runs, and retries.
     */
    this.redlock = new Redlock([this.redis], { retryCount: -1 })

    console.info('Atomicity connecting to redis', { host: this.redis.options.host })
  }

  async close () {
    this.redis?.disconnect()

    // a closed connection holds nothing: it is opened again with whatever is configured then,
    // and a client that has been disconnected would fail every command put to it
    this.redis = undefined
    this.meter = undefined
    this.redlock = undefined
  }
}

const OPTIONS = { enableReadyCheck: true }

function resolve () {
  const value = process.env[VARIABLE]

  // an empty value is atomicity turned off, where an absent one in development is the
  // local Redis — as everything else in development resolves
  if (value === undefined) return process.env.TOA_DEV === '1' ? DEV : undefined

  return value === '' ? undefined : value
}

let instance

/** the connection every atom of the process shares */
const connection = () => (instance ??= new Connection())

/** @internal for tests */
const reset = () => (instance = undefined)

const VARIABLE = 'TOA_ATOMICITY_REDIS'
const DEV = 'redis://localhost'

exports.Connection = Connection
exports.connection = connection
exports.reset = reset
exports.VARIABLE = VARIABLE
