import { environment } from '@toa.io/generic'
import { index, prune } from './indexes.js'

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
      await index(this.#collection, fields, options)

    await prune(this.#collection, Object.keys(desired))
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
