'use strict'

const { console } = require('openspan')
const { Connector } = require('@toa.io/core')

/**
 * What one group of replicas decides together, in one place: which of them owns what, what they
 * have spent between them, and which of them holds a name while it works.
 *
 * @implements {toa.core.atomicity.Atom}
 */
class Atom extends Connector {
  #connection
  #name
  #interval

  /** @type {{ i: number, n: number } | null} */
  #assignment = null

  /** @type {AbortController} */
  #abort

  /** @type {Promise<void>} */
  #discovering

  /** the loop's own logger, carrying the group every line belongs to */
  #console

  constructor (connection, name, interval) {
    super()

    this.#connection = connection
    this.#name = name
    this.#interval = interval ?? override() ?? INTERVAL
    this.#console = console.fork({ group: name })

    this.depends(connection)
  }

  /**
   * An exclusive claim on slots of `0..total`: while this replica holds one, no other replica
   * of the group does.
   *
   * The arithmetic is n-and-i. Every replica registers in a Redis counter once per interval
   * and receives a `{ i, n }` pair once two consecutive intervals have agreed on it, so a
   * replica that has just joined, stalled or restarted claims nothing until the group has
   * settled.
   *
   * @param total {number}
   * @returns {number[] | null} null while this replica owns nothing
   */
  slots (total) {
    const assignment = this.#assignment

    if (assignment === null) return null

    const { i, n } = assignment
    const owned = []

    for (let slot = i; slot < total; slot += n) owned.push(slot)

    return owned
  }

  /**
   * Debt the group has run up under each key, in milliseconds: every call adds its own deltas
   * and reads back where the group stands, so a replica reports only what it has spent and
   * still throttles on what all of them have.
   *
   * @param {string[]} keys
   * @param {number[]} deltas
   * @returns {Promise<number[]>}
   */
  async meter (keys, deltas) {
    const meter = this.#connection.meter

    if (meter === undefined)
      throw new Error('Metering requires atomicity. Set TOA_ATOMICITY_REDIS.')

    return meter.meter(this.#keys('meter', keys), deltas)
  }

  /**
   * Runs `routine` holding `keys`, and while it holds them no other replica of the group does.
   * Waits for as long as it takes to acquire them.
   *
   * @param {string | string[]} keys
   * @param {() => Promise<any>} routine
   * @returns {Promise<any>}
   */
  async lock (keys, routine) {
    const redlock = this.#connection.redlock

    if (redlock === undefined)
      throw new Error('Locking requires atomicity. Set TOA_ATOMICITY_REDIS.')

    return redlock.using(this.#keys('lock', keys), LEASE, routine)
  }

  /**
   * Keys belong to the group, so two groups using the same name do not meet.
   *
   * @private
   */
  #keys (kind, keys) {
    if (typeof keys === 'string') keys = [keys]

    return keys.map((key) => `${this.#name}:${kind}:${key}`)
  }

  async open () {
    const redis = this.#connection.redis

    // without a Redis nothing can be owned exclusively, so nothing is claimed at all
    if (redis === undefined) return

    this.#abort = new AbortController()
    this.#discovering = this.#discover(redis)
  }

  async close () {
    this.#assignment = null

    this.#abort?.abort()

    await this.#discovering
  }

  /**
   * Nothing is caught here on purpose. A registration that fails is handled inside n-and-i,
   * which hands out the idle pair rather than raising, and an aborted signal ends the loop the
   * way `break` does — so the only thing that can reach this is a fault in the call itself,
   * and a fault deserves to be seen rather than turned into standing down.
   *
   * @private
   */
  async #discover (redis) {
    const { discover } = await import('n-and-i')

    const loop = discover({
      redis,
      name: this.#name,
      interval: this.#interval,
      signal: this.#abort.signal,
      console: this.#console
    })

    // the loop yields when ownership changes, which is exactly when work has to be handed over
    for await (const { i, n } of loop)
      this.#assignment = i === null ? null : { i, n }
  }
}

function override () {
  const value = Number(process.env.TOA_ATOMICITY_INTERVAL)

  return Number.isNaN(value) || value <= 0 ? undefined : value
}

const INTERVAL = 5000

/** how long a lock is held before it has to be extended, in milliseconds */
const LEASE = 5000

exports.Atom = Atom
