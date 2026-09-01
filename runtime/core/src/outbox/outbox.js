'use strict'

const { console } = require('openspan')
const { Connector } = require('../connector')
const { newid } = require('../entities/newid')

/**
 * Owns the intent to publish. A row is built before the write so that the storage can commit
 * it in the same transaction as the entity; publication then happens off the operation's path,
 * and anything that fails to publish is recovered from the row.
 *
 * The mechanism is a safety net: in a healthy system the row is written, published within
 * milliseconds by the same process, and marked published on that process's next tick.
 *
 * A storage that cannot commit a row atomically has no outbox, and this degrades to the
 * inline emission it replaces.
 */
class Outbox extends Connector {
  #emission
  #storage
  #atom

  #gap
  #interval
  #batch
  #defer

  /** ids this process has published, held until a cycle marks them */
  #published = new Set()

  /** in-flight publications, awaited (with a bound) on close */
  #inflight = new Set()

  /** rows this replica is publishing right now, so a cycle does not pick them up again */
  #publishing = new Set()

  #timer
  #pumping = false
  #closing = false

  constructor (emission, storage, atom, options = {}) {
    super()

    this.#emission = emission
    this.#storage = storage
    this.#atom = atom

    this.#interval = number('TOA_OUTBOX_INTERVAL', options.interval, INTERVAL)
    this.#batch = number('TOA_OUTBOX_BATCH', options.batch, BATCH)
    this.#gap = options.gap ?? this.#interval * K
    this.#defer = process.env.TOA_OUTBOX_DEFER === '1'

    this.depends(emission)

    if (storage !== undefined) this.depends(storage)

    /*
     * The atom is deliberately not a dependency. Whether rows are durable at all is only known
     * once the storage is open, and coordinating the pump of a storage that cannot commit a
     * row would open a connection to accomplish nothing.
     */
  }

  /** whether the storage can commit a row atomically with the entity */
  get durable () {
    return this.#storage?.outbox !== undefined
  }

  /**
   * @param event {toa.core.transition.Event}
   * @returns {object}
   */
  row (event) {
    return {
      id: newid(),
      lane: this.#lane(),
      published: false,
      pending: Date.now() + this.#gap,
      event
    }
  }

  /**
   * Hands a committed row over. Awaited by the caller only on the legacy path — with an
   * outbox this returns at once and the broker leaves the operation's path.
   */
  publish (row) {
    if (!this.durable)
      return this.#emission.emit(row.event)

    /*
     * A publication started while the pump is closing would outlive the emitters it needs,
     * and `comq` waits on a connection that is going rather than failing. The row is already
     * durable, so leaving it is exactly what it is for.
     */
    if (this.#closing || this.#defer ||
      this.#inflight.size >= INFLIGHT || this.#published.size >= PUBLISHED)
      return

    void this.#publish(row)
  }

  async open () {
    if (!this.durable) return

    await this.#atom?.connect()

    if (this.#defer)
      console.warn('Outbox immediate publication is deferred; events are published by the pump only')

    if (this.#atom === undefined)
      console.warn('Outbox has no atomicity, so its pump reads nothing: rows are written ' +
        'and published, but what fails to publish waits until lanes can be claimed. ' +
        'Set TOA_ATOMICITY_REDIS.')

    this.#timer = setInterval(() => this.#tick(), this.#interval)
    this.#timer.unref()
  }

  async close () {
    this.#closing = true

    if (this.#timer !== undefined) clearInterval(this.#timer)

    // stop reading before draining: a cycle that started would publish into a broker
    // connection that is about to go
    await this.#atom?.disconnect()

    await this.#drain()
    await this.#mark()
  }

  /**
   * Publishes one row and swallows the failure: the row stays unpublished and comes back on a
   * later cycle, which is the whole point of having written it.
   *
   * There is no timeout here on purpose. A publication is a confirmed write to a durable
   * exchange, and `comq` waits for the broker to come back rather than failing — abandoning
   * it would not stop it, it would only mean the row is published twice once it lands. What
   * bounds this instead is the in-flight cap and the drain on close.
   *
   * @private
   */
  async #publish (row) {
    this.#publishing.add(row.id)

    const publishing = this.#emission.emit(row.event)

    this.#inflight.add(publishing)

    try {
      await publishing

      this.#published.add(row.id)
    } catch (error) {
      console.warn('Event publication failed', { row: row.id, error })
    } finally {
      this.#inflight.delete(publishing)
      this.#publishing.delete(row.id)
    }
  }

  /**
   * `comq` retries a publish for as long as the broker is down rather than rejecting, so an
   * unbounded drain outlives any grace period.
   *
   * @private
   */
  async #drain () {
    if (this.#inflight.size === 0) return

    await Promise.race([Promise.allSettled([...this.#inflight]), delay(DRAIN)])
  }

  /**
   * Reads what is due, publishes it, and marks everything this process has sent — what it just
   * published and what the immediate path published since the last cycle. One cycle at a time.
   *
   * @private
   */
  #tick () {
    if (this.#pumping) return

    this.#pumping = true

    void this.#pump().finally(() => (this.#pumping = false))
  }

  /** @private */
  async #pump () {
    let page

    do {
      page = await this.#read(page?.[page.length - 1]?.id)

      if (page.length === 0) break

      /*
       * A row is unpublished in the database until a cycle marks it, so a page includes what
       * this replica is sending right now and what a failed marking left behind. Only this
       * process knows either.
       */
      const rows = page.filter((row) =>
        !this.#published.has(row.id) && !this.#publishing.has(row.id))

      if (rows.length > 0) {
        console.info('Outbox recovering unpublished events', { count: rows.length })

        // every row is given its chance; what the broker refused stays unpublished and comes
        // back on a later cycle
        await Promise.allSettled(rows.map((row) => this.#publish(row)))
      }

      // a full page is a page that may have been cut short
    } while (page.length === this.#batch)

    await this.#mark()
  }

  /**
   * One page of what is due. In a healthy system the first one is empty, every cycle — a row is
   * due only if the process that wrote it failed to publish or died before marking it.
   *
   * Reading is suspended, not stopped, while this replica does not know which lanes are its
   * own: the cycle keeps running and keeps marking, and reading resumes as soon as an
   * assignment arrives. Reading without an assignment would be a different guarantee, where
   * every replica publishes every stranded row.
   *
   * @private
   * @param {string} [after] the last id of the page before, so a page is never read twice
   */
  async #read (after) {
    const lanes = this.#atom?.slots(LANES) ?? null

    if (lanes === null || lanes.length === 0) return []

    return this.#storage.outbox.pending(lanes, Date.now(), this.#batch, after)
      .catch((error) => {
        console.warn('Outbox read failed', { error })

        return []
      })
  }

  /**
   * One batched write for many events, which is why the ids are held in memory rather than
   * marked one by one. Ids that fail to be marked are kept and retried; a row that is never
   * marked is simply published again, which is within the contract.
   *
   * @private
   */
  async #mark () {
    if (this.#published.size === 0) return

    const ids = [...this.#published]

    try {
      await this.#storage.outbox.settle(ids)

      for (const id of ids) this.#published.delete(id)
    } catch (error) {
      console.warn('Outbox marking failed', { count: ids.length, error })
    }
  }

   /**
   * A lane this replica currently owns, so that in steady state it settles its own rows
   * before it ever reads them. Any lane at all when it owns none: the row still has to be
   * written, and whoever ends up owning that lane will pump it.
   *
   * @private
   */
  #lane () {
    const owned = this.#atom?.slots(LANES) ?? null

    return owned === null || owned.length === 0
      ? Math.floor(Math.random() * LANES)
      : owned[Math.floor(Math.random() * owned.length)]
  }
}

function number (variable, declared, fallback) {
  if (declared !== undefined) return declared

  const value = Number(process.env[variable])

  return Number.isNaN(value) || value <= 0 ? fallback : value
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms).unref())

/**
 * Constant, never configuration: rows carry their lane, so lowering this would leave rows in
 * lanes nobody reads any more. It is also the ceiling on replicas of one component, and a
 * power of two so that the common replica counts divide evenly.
 */
const LANES = 128

/** one cycle reads, publishes and marks; in steady state it finds nothing to read */
const INTERVAL = 5000

/**
 * `gap = interval * K`. Not a steady-state necessity — a replica writes into a lane it owns
 * and marks what it published — but a guard for when a lane changes hands between the write
 * and the settle. Two cycles of separation, plus one of margin.
 */
const K = 3

/** how many rows one read brings back; the pump reads on while a page comes back full */
const BATCH = 200

const DRAIN = 10_000
const INFLIGHT = 1000
const PUBLISHED = 10_000

exports.Outbox = Outbox
exports.LANES = LANES
