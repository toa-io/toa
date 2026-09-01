'use strict'

const { Redlock } = require('@sesamecare-oss/redlock')
const { Redis } = require('ioredis')
const { console } = require('openspan')
const { Connector } = require('@toa.io/core')
const { Meter } = require('./meter')

/**
 * One set of clients per process, shared by every atom in it. Each keeps its own keys, so a
 * composition of five components opens one connection between them however much they decide.
 */
class Connection extends Connector {
  /**
   * The one the registry and the meter use. Both count on a single key — replicas per interval,
   * debt per name — and a key spread over several servers would be several answers.
   *
   * @type {import('ioredis').Redis}
   */
  redis

  /** @type {Meter} */
  meter

  /** @type {Redlock} */
  redlock

  /** @type {import('ioredis').Redis[]} */
  #clients = []

  async open () {
    const urls = resolve()

    if (urls.length === 0) {
      console.warn('Atomicity is not configured, so nothing is owned and nothing is metered. ' +
        'Set TOA_ATOMICITY_REDIS.')

      return
    }

    /*
     * Refused rather than degraded, because an even number can never be what it looks like: a
     * lock is taken on `floor(n / 2) + 1` of the addresses, so four tolerate one loss exactly
     * as three do, and two tolerate none at all — one fewer than one address does.
     */
    if (urls.length % 2 === 0)
      throw new Error(`Atomicity takes an odd number of addresses, ${urls.length} given.`)

    this.#clients = urls.map((url) => new Redis(url, OPTIONS))

    /*
     * Connecting is not awaited, and a failure to connect is not an error here. Coordination
     * that cannot be reached must read exactly as coordination that was never configured —
     * nothing is owned, and whoever asked stands down — and a process that could not start
     * because of it would be the opposite of that. The client retries on its own, so a Redis
     * that comes up later is picked up without anything being restarted.
     */
    for (const client of this.#clients)
      // ioredis leaves `message` empty on a refused connection, where the code is the whole story
      client.on('error', (error) =>
        console.warn('Atomicity is unreachable, so nothing is owned',
          { host: client.options.host, error: error.code ?? error.message }))

    this.redis = this.#clients[0]

    // one script per process, whatever the groups sharing this client meter under
    this.meter = new Meter(this.redis)

    /*
     * Every address, because this is the one decision that can be taken on a quorum: the same
     * key is written to all of them, and a majority holding it survives losing a minority. The
     * registry and the meter cannot be held that way — their key is one key — so the addresses
     * past the first buy an uninterrupted lock and nothing else.
     */
    this.redlock = new Redlock(this.#clients, { retryCount: -1 })

    console.info('Atomicity connecting to redis', { nodes: this.#clients.length })
  }

  async close () {
    for (const client of this.#clients) client.disconnect()

    // a closed connection holds nothing: it is opened again with whatever is configured then,
    // and a client that has been disconnected would fail every command put to it
    this.#clients = []
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
  if (value === undefined) return process.env.TOA_DEV === '1' ? [DEV] : []

  return value.split(' ').filter((url) => url !== '')
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
