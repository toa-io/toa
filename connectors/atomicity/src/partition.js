'use strict'

const { console } = require('openspan')
const { Connector } = require('@toa.io/core')

/**
 * Answers which of a fixed number of slots this replica owns, exclusively: while it holds one,
 * no other replica of the group does.
 *
 * The arithmetic is n-and-i. Every replica registers in a Redis counter once per interval and
 * receives a `{ i, n }` pair once two consecutive intervals have agreed on it, so a replica
 * that has just joined, stalled or restarted claims nothing until the group has settled.
 *
 * @implements {toa.core.atomicity.Partition}
 */
class Partition extends Connector {
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

    await this.#discovering?.catch(() => undefined)
  }

  /** @private */
  async #discover (redis) {
    const { discover } = await import('n-and-i')

    const loop = discover({
      redis,
      name: this.#name,
      interval: this.#interval,
      signal: this.#abort.signal,
      console: this.#console
    })

    try {
      // the loop yields when ownership changes, which is exactly when work has to be
      // handed over
      for await (const { i, n } of loop) {
        this.#assignment = i === null ? null : { i, n }

        this.#console.info('Slots assigned', this.#assignment ?? { i: null })
      }
    } catch (error) {
      if (this.#abort.signal.aborted) return

      // owning nothing is the safe failure: whoever depends on this stands down rather
      // than acting on a claim it cannot support
      this.#console.error('Assignment failed; this replica owns nothing until it recovers',
        { error })

      this.#assignment = null
    }
  }
}

function override () {
  const value = Number(process.env.TOA_ATOMICITY_INTERVAL)

  return Number.isNaN(value) || value <= 0 ? undefined : value
}

const INTERVAL = 10_000

exports.Partition = Partition
