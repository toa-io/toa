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
  #defer

  /** ids published but not yet marked so, settled in one batch on the tick */
  #settled = new Set()

  /** in-flight publications, awaited (with a bound) on close */
  #inflight = new Set()

  /** rows this replica is publishing right now, so a sweep does not pick them up again */
  #publishing = new Set()

  #timer
  #settling = false
  #sweeping = false
  #closing = false

  constructor (emission, storage, atom, options = {}) {
    super()

    this.#emission = emission
    this.#storage = storage
    this.#atom = atom

    this.#interval = interval(options.interval)
    this.#gap = options.gap ?? this.#interval * K
    this.#defer = process.env.TOA_OUTBOX_DEFER === '1'

    this.depends(emission)

    if (storage !== undefined) this.depends(storage)

    /*
     * The atom is deliberately not a dependency. Whether rows are durable at all is only known
     * once the storage is open, and coordinating the sweep of a storage that cannot commit a
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
      this.#inflight.size >= INFLIGHT || this.#settled.size >= SETTLED)
      return

    void this.#publish(row)
  }

  async open () {
    if (!this.durable) return

    await this.#atom?.connect()

    if (this.#defer)
      console.warn('Outbox immediate publication is deferred; events are published by the sweep only')

    if (this.#atom === undefined)
      console.warn('Outbox has no atomicity, so its sweep stays suspended: rows are written ' +
        'and published, but what fails to publish waits until lanes can be claimed. ' +
        'Set TOA_ATOMICITY_REDIS.')

    this.#timer = setInterval(() => this.#tick(), this.#interval)
    this.#timer.unref()
  }

  async close () {
    this.#closing = true

    if (this.#timer !== undefined) clearInterval(this.#timer)

    // stop reading before draining: a sweep that started would publish into a broker
    // connection that is about to go
    await this.#atom?.disconnect()

    await this.#drain()
    await this.#settle()
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

      this.#settled.add(row.id)
    } catch (error) {
      console.error('Event publication failed; the outbox will retry it',
        { row: row.id, error })
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
   * The two halves are guarded apart. A replica writes into a lane it owns, so settling first
   * means its own rows are already marked by the time it looks at that lane — but a
   * publication waiting on a broker that is down must not take the marking down with it, and
   * it would if one guard covered both.
   *
   * @private
   */
  #tick () {
    if (!this.#settling) {
      this.#settling = true

      void this.#settle().finally(() => (this.#settling = false))
    }

    if (!this.#sweeping) {
      this.#sweeping = true

      void this.#sweep().finally(() => (this.#sweeping = false))
    }
  }

  /**
   * The recovery path. In a healthy system the query returns nothing, every cycle — a row is
   * only due here if the process that wrote it failed to publish or died before settling.
   *
   * Reading is suspended, not stopped, while this replica does not know which lanes are its
   * own: the cycle keeps running and keeps settling, and the sweep resumes by itself as soon
   * as an assignment arrives. So a rebalance pauses recovery for an interval or two rather
   * than ending it, and rows simply wait for their owner.
   *
   * Sweeping without an assignment would not be a degraded version of this — it would be a
   * different guarantee, one where every replica publishes every stranded row.
   *
   * @private
   */
  async #sweep () {
    const lanes = this.#atom?.slots(LANES) ?? null

    if (lanes === null || lanes.length === 0) return

    const due = await this.#storage.outbox.pending(lanes, Date.now(), LIMIT)
      .catch((error) => {
        console.error('Outbox sweep failed', { error })

        return []
      })

    /*
     * A row is unpublished in the database until a cycle marks it, so what is due there
     * includes what this replica has already sent and what it is sending right now. Only this
     * process knows that, and only until it marks them.
     *
     * The in-flight case needs `gap` to have elapsed while a publication was still pending,
     * which is unlikely — and it is exactly the unlikely case that would otherwise deliver
     * twice for no reason.
     */
    const rows = due.filter((row) => !this.#settled.has(row.id) && !this.#publishing.has(row.id))

    if (rows.length === 0) return

    console.info('Outbox recovering unpublished events', { count: rows.length })

    // every row is given its chance; what the broker refused stays unpublished and comes
    // back on a later cycle
    await Promise.allSettled(rows.map((row) => this.#publish(row)))
  }

  /**
   * One batched write for many events, which is why the ids are held in memory rather than
   * marked one by one. Ids that fail to settle go back and are retried; a row that is never
   * settled is simply published again by a sweep, which is within the contract.
   *
   * @private
   */
  async #settle () {
    if (this.#settled.size === 0) return

    const ids = [...this.#settled]

    try {
      await this.#storage.outbox.settle(ids)

      // held until the write is through, not until it is issued: a sweep running in the
      // meantime reads a row that is still unpublished in the database, and this set is the
      // only thing that knows better
      for (const id of ids) this.#settled.delete(id)
    } catch (error) {
      console.error('Outbox settle failed; the ids will be retried', { count: ids.length, error })
    }
  }

   /**
   * A lane this replica currently owns, so that in steady state it settles its own rows
   * before it ever sweeps them. Any lane at all when it owns none: the row still has to be
   * written, and whoever ends up owning that lane will sweep it.
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

function interval (declared) {
  const override = Number(process.env.TOA_OUTBOX_INTERVAL)

  if (!Number.isNaN(override) && override > 0) return override

  return declared ?? INTERVAL
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms).unref())

/**
 * Constant, never configuration: rows carry their lane, so lowering this would leave rows in
 * lanes nobody reads any more. It is also the ceiling on replicas of one component, and a
 * power of two so that the common replica counts divide evenly.
 */
const LANES = 128

/** one tick settles, then sweeps; in steady state it finds nothing to sweep */
const INTERVAL = 5000

/**
 * `gap = interval * K`. Not a steady-state necessity — a replica writes into a lane it owns
 * and settles before it sweeps — but a guard for when a lane changes hands between the write
 * and the settle. Two cycles of separation, plus one of margin.
 */
const K = 3

const LIMIT = 200
const DRAIN = 10_000
const INFLIGHT = 1000
const SETTLED = 10_000

exports.Outbox = Outbox
exports.LANES = LANES
