import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { Timestamp } from 'mongodb'
import { exceptions, parts } from '@toa.io/core'
import { match } from './match.js'

/**
 * A collection read as a stream, and what changed in it since a token.
 *
 * A token is a position in the history MongoDB keeps of the writes committed to the collection —
 * a change stream's resume token — so what it continues from is the order writes committed in.
 * A first read takes the position before it reads anything: what committed before it is in what
 * the read finds, and what committed after it is in the next read. A page is read after the last
 * `_id` of the one before it, ordered by `_id`, which never changes, so an entry stays on one side
 * of a page boundary for the whole read.
 *
 * Where MongoDB keeps no such history — a standalone server, or a collection that keeps no images
 * of a record before a change — pages are still read, and a complete read ends with a `null`
 * token: there is nothing to continue from.
 */
export class Streams {
  /** @type {import('mongodb').Collection} */
  #collection

  /** @type {() => import('mongodb').MongoClient} the client sessions are started on */
  #client

  /** @type {(record: object) => object} */
  #from

  /** whether a position can be taken and read from */
  #history

  constructor(collection, client, from, history) {
    this.#collection = collection
    this.#client = client
    this.#from = from
    this.#history = history
  }

  /**
   * @param {{ criteria: object, options: object }} translated
   * @param {string} [given] the token the read continues from
   * @returns {Promise<Readable>}
   */
  async stream(translated, given) {
    const { criteria, options } = translated
    const hash = digest(criteria)

    if (given === undefined) return await this.#first(criteria, options, hash)

    const token = decode(given)

    if (token.h !== hash)
      throw new exceptions.QuerySyntaxException('The token was issued for other criteria')

    if (token.id !== undefined) return await this.#page(criteria, options, hash, token)
    if (token.p === null || !this.#history) throw lost()

    return await this.#changes(criteria, options, hash, token)
  }

  async #first(criteria, options, hash) {
    const session = this.#client().startSession({ causalConsistency: true })

    try {
      const position = this.#history ? await this.#position(session) : null

      return await this.#read(criteria, options, hash, session, position, undefined)
    } catch (exception) {
      await session.endSession()

      throw exception
    }
  }

  async #page(criteria, options, hash, token) {
    if (token.p !== null && !this.#history) throw lost()

    const session = this.#client().startSession({ causalConsistency: true })

    if (token.t !== null) session.advanceOperationTime(new Timestamp(BigInt(token.t)))

    const position = token.p === null ? null : { p: token.p, t: token.t }

    try {
      return await this.#read(criteria, options, hash, session, position, token.id)
    } catch (exception) {
      await session.endSession()

      throw exception
    }
  }

  /**
   * The position: the resume token of a change stream opened with a batch of none. Its
   * operation time is where a page is read at, so that a member of the replica set behind it
   * waits until it has replicated it.
   */
  async #position(session) {
    const db = this.#collection.s.db
    const name = this.#collection.collectionName

    const reply = await db.command(
      { aggregate: name, pipeline: [{ $changeStream: {} }], cursor: { batchSize: 0 } },
      { session }
    )

    const { id, postBatchResumeToken } = reply.cursor

    if (!id.isZero()) await db.command({ killCursors: name, cursors: [id] }, { session })

    return { p: postBatchResumeToken._data, t: session.operationTime.toString() }
  }

  /**
   * The collection, or a page of it. A read that pages is ordered by `_id` and continues after the
   * last one; one that does not is read in the order the query states.
   */
  async #read(criteria, options, hash, session, position, after) {
    const limit = options.limit
    const filter = after === undefined ? criteria : { $and: [criteria, { _id: { $gt: after } }] }

    const read = { ...options, session, readConcern: { level: 'majority' } }

    if (limit !== undefined) read.sort = { _id: 1 }

    const cursor = this.#collection.find(filter, read)

    // what refuses the read refuses it before a part is sent, where it is still an answer
    await cursor.hasNext()

    const from = this.#from

    async function* yielding() {
      let count = 0
      let last

      try {
        for await (const record of cursor) {
          count++
          last = record._id

          yield parts.entry(from(record))
        }

        if (limit !== undefined && count === limit)
          yield parts.token(encode({ v: VERSION, p: position?.p ?? null, t: position?.t ?? null, id: last, h: hash }))
        else yield parts.token(position === null ? null : encode({ v: VERSION, p: position.p, h: hash }))
      } finally {
        await cursor.close()
        await session.endSession()
      }
    }

    return Readable.from(yielding())
  }

  /**
   * What committed after the token that concerns the collection: a change whose image after it matches
   * the criteria is an entry, and one whose image before it alone does is a removal. A change
   * that concerns neither is left out by the pipeline, so a reader learns no id it cannot read.
   */
  async #changes(criteria, options, hash, token) {
    const pipeline = [
      {
        $match: {
          $or: [
            prefix(criteria, 'fullDocument.'),
            prefix(criteria, 'fullDocumentBeforeChange.'),
            { operationType: { $in: ENDINGS } }
          ]
        }
      }
    ]

    const stream = this.#collection.watch(pipeline, {
      startAfter: { _data: token.p },
      fullDocument: 'required',
      fullDocumentBeforeChange: 'required'
    })

    const limit = options.limit

    let first

    try {
      first = await stream.tryNext()
    } catch (exception) {
      await stream.close()

      throw refusal(exception)
    }

    const from = this.#from

    async function* yielding() {
      let count = 0
      let event = first

      try {
        while (event !== null) {
          if (ENDINGS.includes(event.operationType)) throw lost()

          const part = classify(event, criteria, from)

          if (part !== undefined) {
            count++

            yield part
          }

          if (limit !== undefined && count >= limit) break

          event = await stream.tryNext().catch((exception) => {
            throw refusal(exception)
          })
        }

        yield parts.token(encode({ v: VERSION, p: stream.resumeToken._data, h: hash }))
      } finally {
        await stream.close()
      }
    }

    return Readable.from(yielding())
  }
}

function classify(event, criteria, from) {
  const after = event.fullDocument
  const before = event.fullDocumentBeforeChange

  if (after !== undefined && after !== null && match(after, criteria)) return parts.entry(from(after))

  if (before !== undefined && before !== null && match(before, criteria))
    return parts.removed(String(event.documentKey._id))

  return undefined
}

/**
 * The criteria against an image of a change stream event. A key that is an operator carries
 * filters, and every other key is a field of the record.
 */
function prefix(filter, path) {
  const result = {}

  for (const [key, value] of Object.entries(filter))
    if (LOGICAL.includes(key)) result[key] = value.map((filter) => prefix(filter, path))
    else if (key.startsWith('$'))
      throw new exceptions.QuerySyntaxException(`What changed in a collection cannot be read by '${key}'`)
    else result[path + key] = value

  return result
}

function refusal(exception) {
  if (LOST.includes(exception?.code) || exception?.hasErrorLabel?.('NonResumableChangeStreamError'))
    return lost()

  return exception
}

function lost() {
  return new exceptions.StateHistoryException('The token names a point the storage no longer holds')
}

/**
 * The criteria a token was issued for: a read that continues from it under other criteria would
 * answer the changes to one collection as if they were those of another.
 */
function digest(criteria) {
  return createHash('sha1').update(JSON.stringify(criteria)).digest('base64url').slice(0, 16)
}

function encode(token) {
  return Buffer.from(JSON.stringify(token)).toString('base64url')
}

/** A token this storage did not write, or wrote in another format, names nothing it holds. */
function decode(given) {
  let token

  try {
    token = JSON.parse(Buffer.from(given, 'base64url').toString())
  } catch {
    throw lost()
  }

  const valid =
    token !== null &&
    typeof token === 'object' &&
    token.v === VERSION &&
    typeof token.h === 'string' &&
    (typeof token.p === 'string' || token.p === null) &&
    (token.id === undefined || typeof token.id === 'string') &&
    (token.id === undefined || token.t === null || typeof token.t === 'string')

  if (!valid) throw lost()

  return token
}

/** the format of a token, which a storage that reads another refuses */
const VERSION = 1

const LOGICAL = ['$and', '$or', '$nor']

/** what ends a change stream: the collection it follows is gone or renamed */
const ENDINGS = ['drop', 'rename', 'dropDatabase', 'invalidate']

/**
 * ChangeStreamHistoryLost, ChangeStreamFatalError (a resume token that is not in the oplog), and
 * NoMatchingDocument (an image that has expired).
 */
const LOST = [286, 280, 47]
