import { environment } from '@toa.io/generic'
import { index, prune } from './indexes.js'

/**
 * The calls a component has already made good on. Its lifecycle is the Client's, so it is not
 * a Connector.
 *
 * Core owns what a record means — its identity and the reply it holds. This only writes it,
 * inside the transaction the entity is written in, and reads one back.
 */
export class Inbox {
  /** @type {import('mongodb').Collection} */
  #collection

  #retention

  constructor(collection) {
    this.#collection = collection
    this.#retention = retention()
  }

  /**
   * What the call under this identity answered, or `null` where it was never made.
   *
   * @param {string} id
   * @returns {Promise<object | null>}
   */
  async recall(id) {
    const record = await this.#collection.findOne(
      { _id: id },
      { projection: { reply: 1 } }
    )

    return record === null ? null : (record.reply ?? {})
  }

  /**
   * Writes the call down, in the session the entity is written in. A duplicate key is the
   * whole mechanism: the call has been made, this transaction changes nothing, and the caller
   * is answered from what is already there.
   *
   * @param {{ id: string, reply: object }} call
   * @param {import('mongodb').ClientSession} session
   */
  async insert(call, session) {
    await this.#collection.insertOne(
      { _id: call.id, reply: call.reply ?? {}, at: new Date() },
      { session }
    )
  }

  /**
   * The runtime's own index, not the component's, so it is declared here rather than in a
   * migration a component would have to write — including pruning, or a later change leaves
   * the old index behind forever.
   */
  async index() {
    const desired = {
      // how long a call is remembered is how long a duplicate of it is caught
      inbox_at: {
        fields: { at: 1 },
        options: { name: 'inbox_at', expireAfterSeconds: this.#retention }
      }
    }

    for (const { fields, options } of Object.values(desired))
      await index(this.#collection, fields, options)

    await prune(this.#collection, Object.keys(desired))
  }
}

function retention() {
  const value = Number(environment.get('TOA_INBOX_RETENTION'))

  return Number.isNaN(value) || value <= 0 ? RETENTION : value
}

/**
 * Seconds a call is remembered. An hour, and not the outbox's day: what a duplicate arrives
 * within is the broker's redelivery, the five attempts `comq` makes of a message, and whatever
 * a client retries on — minutes. Every call of an operation that declares `once` is a document
 * here for this long.
 */
const RETENTION = 3600
