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
 * the read finds, and what committed after it is in the next read. A window is read after the last
 * `_id` of the one before it, ordered by `_id`, which never changes, so an entry stays on one side
 * of a window boundary for the whole read.
 *
 * Where MongoDB keeps no such history — a standalone server, or a collection that keeps no images
 * of a record before a change — windows are still read, and a complete read ends with a `null`
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
    const hash = digest(criteria, options.sort)

    if (given === undefined) return await this.#first(criteria, options, hash)

    const token = decode(given)

    if (token.h !== hash)
      throw new exceptions.QuerySyntaxException('The token was issued for other criteria or order')

    if (token.id !== undefined) return await this.#window(criteria, options, hash, token)
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

  async #window(criteria, options, hash, token) {
    if (token.p !== null && !this.#history) throw lost()

    const session = this.#client().startSession({ causalConsistency: true })

    if (token.t !== null) session.advanceOperationTime(new Timestamp(BigInt(token.t)))

    const position = token.p === null ? null : { p: token.p, t: token.t }

    try {
      return await this.#read(criteria, options, hash, session, position, { id: token.id, c: token.c })
    } catch (exception) {
      await session.endSession()

      throw exception
    }
  }

  /**
   * The position: the resume token of a change stream opened with a batch of none. Its
   * operation time is where a window is read at, so that a member of the replica set behind it
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
   * The collection, or a window of it. A read in windows is ordered by what an entry never changes —
   * `_id`, or `CREATED` and then `_id` — and continues after the last entry it read; one that does
   * not is read in the order the query states. A read told to stop ends its window with the position
   * changes continue from.
   */
  async #read(criteria, options, hash, session, position, after) {
    const limit = options.limit
    const order = limit === undefined && after === undefined ? null : ordered(options.sort)
    const filter = after === undefined ? criteria : { $and: [criteria, beyond(order, after)] }

    const read = { ...options, session, readConcern: { level: 'majority' } }

    delete read.stop

    if (order !== null) read.sort = order

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
          last = { id: record._id, c: record.CREATED instanceof Date ? record.CREATED.getTime() : undefined }

          yield parts.entry(from(record))
        }

        if (limit !== undefined && count === limit && options.stop !== true) {
          const window = { v: VERSION, p: position?.p ?? null, t: position?.t ?? null, id: last.id, h: hash }

          if (order?.[0]?.[0] === 'CREATED') window.c = last.c

          yield parts.token(encode(window))
        } else yield parts.token(position === null ? null : encode({ v: VERSION, p: position.p, h: hash }))
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
 * The criteria and the order a token was issued for: a read that continues from it under other
 * criteria would answer the changes to one collection as if they were those of another, and one in
 * another order would window from a place that order does not have.
 */
function digest(criteria, sort) {
  return createHash('sha1')
    .update(JSON.stringify([criteria, sort ?? null]))
    .digest('base64url')
    .slice(0, 16)
}

/**
 * The order of a read in windows: `_id` ascending unless the query orders by `_id` or `CREATED`,
 * which an entry never changes, and `_id` after `CREATED`, which entries may share. An order by
 * anything else could move an entry across a window boundary mid-read, and is refused.
 */
function ordered(sort) {
  if (sort === undefined || sort.length === 0) return [['_id', 1]]

  for (const [property] of sort)
    if (!UNMOVING.includes(property))
      throw new exceptions.QuerySyntaxException(`A stream read in windows is not ordered by '${property}', which changes`)

  const [[first, direction]] = sort

  return first === '_id' ? [['_id', direction]] : [['CREATED', direction], ['_id', direction]]
}

/** What comes after the last entry a window read, in its order. */
function beyond(order, after) {
  const [[first, direction]] = order
  const past = direction === 1 ? '$gt' : '$lt'

  if (first === '_id') return { _id: { [past]: after.id } }

  const c = new Date(after.c)

  return { $or: [{ CREATED: { [past]: c } }, { CREATED: c, _id: { [past]: after.id } }] }
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
    (token.c === undefined || typeof token.c === 'number') &&
    (token.id === undefined || token.t === null || typeof token.t === 'string')

  if (!valid) throw lost()

  return token
}

/** the format of a token, which a storage that reads another refuses */
const VERSION = 1

const LOGICAL = ['$and', '$or', '$nor']

/** what an entry never changes, and so what a read in windows may be ordered by */
const UNMOVING = ['_id', 'CREATED']

/** what ends a change stream: the collection it follows is gone or renamed */
const ENDINGS = ['drop', 'rename', 'dropDatabase', 'invalidate']

/**
 * ChangeStreamHistoryLost, ChangeStreamFatalError (a resume token that is not in the oplog), and
 * NoMatchingDocument (an image that has expired).
 */
const LOST = [286, 280, 47]
