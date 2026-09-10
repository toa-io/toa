import { console } from 'openspan'
import { environment } from '@toa.io/generic'

/**
 * The outbox rows of one component. Its lifecycle is the Client's, so it is not a Connector.
 *
 * Core owns what a row means — its id, its lane and when it becomes due. This only writes
 * them, reads back what is due, and marks what has been published.
 */
export class Outbox {
  /** @type {import('mongodb').Collection} */
  #collection

  #retention

  constructor(collection) {
    this.#collection = collection
    this.#retention = retention()
  }

  /** @param {import('mongodb').ClientSession} session */
  async insert(row, session) {
    await this.#collection.insertOne(to(row), { session })
  }

  /** @param {import('mongodb').ClientSession} session */
  async insertMany(rows, session) {
    if (rows.length === 0) return

    await this.#collection.insertMany(rows.map(to), { session })
  }

  /**
   * One page of what this replica should publish: due, still unpublished, and in a lane it
   * owns. In steady state the first page is empty.
   *
   * `after` continues from the last id of the page before. Ids are uuid v7, so their order is
   * the order rows were written and a page is never read twice within a cycle — which matters
   * because a row stays unpublished in the database until the cycle that sent it marks it.
   */
  async pending(lanes, now, limit, after = undefined) {
    const criteria = { lane: { $in: lanes }, published: false, pending: { $lte: now } }

    if (after !== undefined) criteria._id = { $gt: after }

    const rows = await this.#collection
      .find(criteria)
      .sort({ _id: 1 })
      .limit(limit)
      .toArray()

    return rows.map(from)
  }

  /**
   * Takes those destinations out of what those rows are outstanding for, and marks published
   * the ones left outstanding for nothing — which is what `pending` selects on and what the
   * TTL reaps by, so neither changes.
   *
   * One batched write for many rows, which is why the ids are held in memory until the tick
   * rather than updated one by one. A row written before this property existed reads as
   * outstanding for `events` alone, which is all there was.
   */
  async settle(ids, destinations) {
    if (ids.length === 0) return

    await this.#collection.updateMany({ _id: { $in: ids } }, [
      {
        $set: {
          outstanding: {
            $setDifference: [{ $ifNull: ['$outstanding', [EVENTS]] }, destinations]
          }
        }
      },
      {
        $set: {
          published: { $eq: [{ $size: '$outstanding' }, 0] },
          // written once, when the last destination lands: an unpublished row has none, and
          // the TTL monitor skips a document that lacks the field it expires by
          publishedAt: {
            $cond: [{ $eq: [{ $size: '$outstanding' }, 0] }, '$$NOW', '$publishedAt']
          }
        }
      }
    ])
  }

  /**
   * These are the runtime's indexes, not the component's, so they are declared here rather
   * than in a migration a component would have to write — including pruning, or a later
   * change leaves the old index behind forever.
   */
  async index() {
    const desired = {
      // holds only what is not published yet, so it stays at in-flight size
      outbox_pending: {
        fields: { lane: 1, pending: 1 },
        options: { name: 'outbox_pending', partialFilterExpression: { published: false } }
      },
      // an unpublished row has no `publishedAt`, and the TTL monitor skips those — so a row
      // that never made it out is never reaped
      outbox_published_at: {
        fields: { publishedAt: 1 },
        options: { name: 'outbox_published_at', expireAfterSeconds: this.#retention }
      }
    }

    for (const { fields, options } of Object.values(desired))
      await this.#index(fields, options)

    await this.#prune(Object.keys(desired))
  }

  /**
   * The name of an index here is fixed, so changing what it is made of — a retention that
   * changes `expireAfterSeconds`, say — leaves that name held by an index of the old shape,
   * which MongoDB refuses to overwrite. The old one is dropped and the declared one made.
   *
   * @private
   */
  async #index(fields, options) {
    try {
      await this.#collection.createIndex(fields, options)
    } catch (e) {
      if (!CONFLICTS.includes(e.code))
        return console.warn('MongoDB outbox index creation failed', {
          collection: this.#collection.collectionName,
          name: options.name,
          error: e
        })

      console.info('Recreating an outbox index whose declaration changed', {
        collection: this.#collection.collectionName,
        name: options.name
      })

      await this.#drop(options.name)
      await this.#collection.createIndex(fields, options)
    }
  }

  /**
   * Concurrent replicas prune the same index, and losing that race is not an error.
   *
   * @private
   */
  async #drop(name) {
    try {
      await this.#collection.dropIndex(name)
    } catch (e) {
      if (e.code !== ERR_INDEX_NOT_FOUND) throw e
    }
  }

  /** @private */
  async #prune(desired) {
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

    console.info('Removing obsolete outbox indexes', {
      collection: this.#collection.collectionName,
      indexes: obsolete.join(', ')
    })

    await Promise.all(obsolete.map((name) => this.#drop(name)))
  }
}

const to = ({ id, ...rest }) => ({ _id: id, ...rest })

// a row written before destinations existed is outstanding for the events, which is all a row
// was ever published to then
const from = ({ _id, ...rest }) => ({ id: _id, outstanding: [EVENTS], ...rest })

function retention() {
  const value = Number(environment.get('TOA_OUTBOX_RETENTION'))

  return Number.isNaN(value) || value < 0 ? RETENTION : value
}

/** what a component's own events are outstanding for; `Emission.name` */
const EVENTS = 'events'

/** seconds a published row is kept as a change log before the TTL monitor reaps it */
const RETENTION = 86400

const ERR_INDEX_NOT_FOUND = 27
const CONFLICTS = [85, 86] // IndexOptionsConflict, IndexKeySpecsConflict
