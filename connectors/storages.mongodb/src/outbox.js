'use strict'

const { console } = require('openspan')

/**
 * The outbox rows of one component. Its lifecycle is the Client's, so it is not a Connector.
 *
 * Core owns what a row means — its id, its lane and when it becomes due. This only writes
 * them, reads back what is due, and marks what has been published.
 */
class Outbox {
  /** @type {import('mongodb').Collection} */
  #collection

  #retention

  constructor (collection) {
    this.#collection = collection
    this.#retention = retention()
  }

  /** @param {import('mongodb').ClientSession} session */
  async insert (row, session) {
    await this.#collection.insertOne(to(row), { session })
  }

  /** @param {import('mongodb').ClientSession} session */
  async insertMany (rows, session) {
    if (rows.length === 0) return

    await this.#collection.insertMany(rows.map(to), { session })
  }

  /**
   * What this replica should publish: due, still unpublished, and in a lane it owns.
   * In steady state this returns nothing, every cycle.
   */
  async pending (lanes, now, limit) {
    const rows = await this.#collection
      .find({ lane: { $in: lanes }, published: false, pending: { $lte: now } })
      .sort({ _id: 1 })
      .limit(limit)
      .toArray()

    return rows.map(from)
  }

  /**
   * One batched write for many events, which is why the ids are held in memory until the
   * tick rather than updated one by one.
   */
  async settle (ids) {
    if (ids.length === 0) return

    await this.#collection.updateMany({ _id: { $in: ids } },
      { $set: { published: true, _published: new Date() } })
  }

  /**
   * The entity collection's index management does not reach here, so this collection keeps
   * its own — including pruning, or a later change leaves the old index behind forever.
   */
  async index () {
    const desired = {
      // holds only what is not published yet, so it stays at in-flight size
      outbox_pending: {
        fields: { lane: 1, pending: 1 },
        options: { name: 'outbox_pending', partialFilterExpression: { published: false } }
      },
      // an unpublished row has no `_published`, and the TTL monitor skips those — so a row
      // that never made it out is never reaped
      outbox_published: {
        fields: { _published: 1 },
        options: { name: 'outbox_published', expireAfterSeconds: this.#retention }
      }
    }

    for (const { fields, options } of Object.values(desired))
      await this.#collection.createIndex(fields, options)
        .catch((e) => console.warn('MongoDB outbox index creation failed',
          { collection: this.#collection.collectionName, name: options.name, error: e }))

    await this.#prune(Object.keys(desired))
  }

  /** @private */
  async #prune (desired) {
    let current

    try {
      current = await this.#collection.listIndexes().toArray()
    } catch {
      return
    }

    const obsolete = current
      .map(({ name }) => name)
      .filter((name) => name !== '_id_' && !desired.includes(name))

    if (obsolete.length === 0) return

    console.info('Removing obsolete outbox indexes',
      { collection: this.#collection.collectionName, indexes: obsolete.join(', ') })

    await Promise.all(obsolete.map((name) => this.#collection.dropIndex(name)))
  }
}

const to = ({ id, ...rest }) => ({ _id: id, ...rest })
const from = ({ _id, ...rest }) => ({ id: _id, ...rest })

function retention () {
  const value = Number(process.env.TOA_OUTBOX_RETENTION)

  return Number.isNaN(value) || value < 0 ? RETENTION : value
}

/** seconds a published row is kept as a change log before the TTL monitor reaps it */
const RETENTION = 86400

exports.Outbox = Outbox
