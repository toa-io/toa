'use strict'

const { console } = require('openspan')
const { Connector } = require('@toa.io/core')

/**
 * Answers which lanes this replica owns. Read on both paths — at write time to pick a lane
 * for a new row, and at sweep time to decide what to look at — which is what keeps a row with
 * the process that wrote it.
 *
 * @implements {toa.core.outbox.Partition}
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

  /** the loop's own logger, carrying the component every line belongs to */
  #console

  constructor (connection, name, interval) {
    super()

    this.#connection = connection
    this.#name = name
    this.#interval = interval ?? override() ?? INTERVAL
    // every line the loop writes carries the component it belongs to
    this.#console = console.fork({ component: name })

    this.depends(connection)
  }

  /**
   * @param total {number}
   * @returns {number[] | null} null while this replica owns nothing
   */
  lanes (total) {
    const assignment = this.#assignment

    if (assignment === null) return null

    const { i, n } = assignment
    const owned = []

    for (let lane = i; lane < total; lane += n) owned.push(lane)

    return owned
  }

  async open () {
    const redis = this.#connection.redis

    // without a Redis there is no partitioning; every replica then sweeps every lane, which
    // is correct and only publishes a stranded row more than once
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
      for await (const { i, n } of loop) {
        // the loop yields when ownership changes, which is exactly when work has to be
        // handed over; the sweep is idempotent, so there is nothing to drain first
        this.#assignment = i === null ? null : { i, n }

        this.#console.info('Outbox partition assigned', this.#assignment ?? { i: null })
      }
    } catch (error) {
      if (this.#abort.signal.aborted) return

      // standing down is the safe failure: nothing is swept until an assignment returns,
      // which is preferable to every replica publishing every stranded row
      this.#console.error('Outbox partitioning failed; this replica sweeps nothing until it recovers',
        { error })

      this.#assignment = null
    }
  }
}

function override () {
  const value = Number(process.env.TOA_OUTBOX_PARTITION_INTERVAL)

  return Number.isNaN(value) || value <= 0 ? undefined : value
}

const INTERVAL = 10_000

exports.Partition = Partition
