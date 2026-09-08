import { Connector, exceptions } from '@toa.io/core'
import { console } from 'openspan'
import { translate } from './translate.js'
import { codec } from './record.js'
import { Outbox } from './outbox.js'
import { Migrations } from './migrations.js'
import { ReturnDocument } from 'mongodb'

export class Storage extends Connector {
  #client

  /** @type {import('mongodb').Collection} */
  #collection
  #entity

  /**
   * @type {Outbox | undefined} absent when nothing consumes this component's events, or when
   * the deployment cannot run transactions
   */
  #outbox

  /** @type {Migrations | undefined} absent where the component declares no migrations */
  #migrations

  /** @type {Map<string, object>} span options per driver method */
  #spans = new Map()

  /** how a record is written and read back, which depends on what the entity declares */
  #to
  #from

  /** properties held as BSON dates, so that a criterion against one is one too */
  #dates

  constructor(client, entity) {
    super()

    this.#client = client
    this.#entity = entity

    const { to, from, dates } = codec(entity?.properties)

    this.#to = to
    this.#from = from
    this.#dates = dates

    this.depends(client)
  }

  get raw() {
    return this.#collection
  }

  /**
   * The outbox is offered only where a row can be committed atomically with the entity.
   * Without that it would be a second write with a window in front of it — worse than the
   * inline emission it replaces — so the storage simply does not advertise it.
   */
  get outbox() {
    return this.#outbox
  }

  /** This storage applies what a component's `migrations` directory declares. */
  get migrates() {
    return true
  }

  /** This storage merges. */
  get merges() {
    return true
  }

  async open() {
    this.#collection = this.#client.collection

    if (this.#client.outbox !== undefined) this.#outbox = new Outbox(this.#client.outbox)

    this.#spans.clear()

    if (this.#entity.migrations?.length > 0) {
      this.#migrations = new Migrations(
        this.#client.db,
        this.#collection,
        this.#entity.migrations
      )

      await this.#migrations.run()
    }

    await this.#outbox?.index()
  }

  async get(query) {
    const { criteria, options } = translate(query, this.#dates)

    // identity lookups must return deleted records, so that callers
    // can tell a deleted entity from a missing one
    if (query?.id === undefined && query?.options?.deleted !== true)
      criteria.DELETED = null

    const record = await this.command('findOne', { criteria, options }, () =>
      this.#collection.findOne(criteria, options)
    )

    return this.#from(record)
  }

  async find(query) {
    const { criteria, options, sample } = translate(query, this.#dates)

    if (query?.options?.deleted !== true) criteria.DELETED = null

    const recordset =
      sample === undefined
        ? await this.command(
            'find',
            { criteria, options },
            async () => await this.#collection.find(criteria, options).toArray()
          )
        : await this.aggregate(criteria, options, sample)

    return recordset.map((item) => this.#from(item))
  }

  /** @private */
  async aggregate(criteria, options, sample) {
    const pipeline = toPipeline(criteria, options, sample)

    return await this.command(
      'aggregate',
      { pipeline },
      async () => await this.#collection.aggregate(pipeline).toArray()
    )
  }

  async stream(query = undefined) {
    const { criteria, options } = translate(query, this.#dates)

    if (query?.options?.deleted !== true) criteria.DELETED = null

    this.debug('find (stream)', { criteria, options })

    return this.#collection.find(criteria, options).stream({ transform: this.#from })
  }

  async add(entity, session = undefined) {
    const record = this.#to(entity)

    const result = await this.command('insertOne', { record }, () =>
      this.#collection.insertOne(record, { session })
    )

    return result.acknowledged
  }

  async set(entity, session = undefined) {
    const criteria = {
      _id: entity.id,
      VERSION: entity.VERSION - 1
    }

    const record = this.#to(entity)

    const result = await this.command('findOneAndReplace', { criteria, record }, () =>
      this.#collection.findOneAndReplace(criteria, record, { session })
    )

    return result !== null
  }

  async store(entity, row = undefined, attempt = 0) {
    try {
      if (row === undefined || this.#outbox === undefined) {
        if (entity.VERSION === 1) return await this.add(entity)
        else return await this.set(entity)
      }

      const committed = await this.#client.transaction(async (session) => {
        const ok =
          entity.VERSION === 1
            ? await this.add(entity, session)
            : await this.set(entity, session)

        // a lost compare-and-swap must take the row down with it, or a retried transition
        // leaves a row for a write that never happened
        if (!ok) {
          await session.abortTransaction()

          return false
        }

        await this.#outbox.insert(row, session)

        return true
      })

      return committed === true
    } catch (error) {
      console.error('MongoDB error', error)

      const retry = await retriable(error, attempt)

      if (retry) return await this.store(entity, row, attempt + 1)
      else return false
    }
  }

  async massStore(entities, rows = undefined, attempt = 0) {
    if (entities.length === 0) return true

    const operations = entities.map((entity) => {
      const record = this.#to(entity)

      if (entity.VERSION === 1) {
        const { VERSION, ...rest } = record

        return {
          // upsert in required when document is deleted
          updateOne: {
            filter: { _id: entity.id },
            update: {
              $set: {
                ...rest,
                DELETED: null
              },
              $inc: { VERSION: 1 }
            },
            upsert: true
          }
        }
      } else
        return {
          replaceOne: {
            filter: { _id: entity.id, VERSION: entity.VERSION - 1 },
            replacement: record
          }
        }
    })

    try {
      await this.#client.transaction(async (session) => {
        await this.command(
          'bulkWrite',
          { operations: operations.length },
          async () => await this.#collection.bulkWrite(operations, { session })
        )

        if (rows !== undefined && this.#outbox !== undefined)
          await this.#outbox.insertMany(rows, session)
      })

      return true
    } catch (error) {
      console.error('MongoDB error', error)

      const retry = await retriable(error, attempt)

      if (retry) return await this.massStore(entities, rows, attempt + 1)
      else return false
    }
  }

  /**
   * The filter selects by `_id` alone, so it always matches what is there and upserts what is
   * not, and the rule is the pipeline: either the incoming document replaces the stored one, or
   * `$$ROOT` stays where it is and nothing changes. That keeps the three answers apart — a
   * record never seen is an upsert, a superseded one is a modification, and a stale one is
   * neither — where putting the rule in the filter would make absence and staleness one and the
   * same miss, and then have the upsert collide on `_id` to say so.
   *
   * `$literal` because a value in a pipeline is an expression, so a property holding a string
   * that begins with `$` would otherwise be read as a field path.
   *
   * `$ifNull` twice, and for two reasons. On the upsert path the pipeline runs over the base
   * document the filter builds, which is `{ _id }`, so a missing `VERSION` reads as `0` — the
   * version an entity holds before its first write. And a record written before `REGION`
   * existed has none, which reads as the first region: what it would have been backfilled
   * with, so nothing is backfilled. A migration would rewrite every document of every
   * collection of every application, converging or not, to store what this reads anyway.
   */
  async merge(record) {
    const document = this.#to(record)

    const supersedes = {
      $or: [
        { $lt: [{ $ifNull: ['$VERSION', 0] }, document.VERSION] },
        {
          $and: [
            { $eq: ['$VERSION', document.VERSION] },
            { $gt: [{ $ifNull: ['$REGION', FIRST] }, document.REGION] }
          ]
        }
      ]
    }

    const pipeline = [
      { $replaceWith: { $cond: [supersedes, { $literal: document }, '$$ROOT'] } }
    ]

    const result = await this.command(
      'updateOne',
      { criteria: { _id: document._id }, pipeline },
      () => this.#collection.updateOne({ _id: document._id }, pipeline, { upsert: true })
    )

    return result.upsertedCount === 1 || result.modifiedCount === 1
  }

  async upsert(query, changeset, row = undefined) {
    const { criteria, options } = translate(query, this.#dates)

    if (!('DELETED' in changeset) || changeset.DELETED === null) {
      delete criteria.DELETED
      changeset.DELETED = null
    }

    const update = {
      $set: { ...changeset },
      $inc: { VERSION: 1 }
    }

    // BEFORE, so that the filter is applied once and atomically and the pre-image comes back
    // with it — an assignment is the one event whose images are the write's own
    options.returnDocument = ReturnDocument.BEFORE

    const apply = async (session) => {
      const found = await this.command(
        'findOneAndUpdate',
        { criteria, update, options },
        () => this.#collection.findOneAndUpdate(criteria, update, { ...options, session })
      )

      if (found === null) return null

      const origin = this.#from(found)

      /*
       * The post-image is `update` applied to the pre-image, computed rather than read back.
       * That is exact, not approximate: `$set` on top-level keys is a spread (entity property
       * names cannot contain dots, so a changeset never carries a path), and `VERSION` is
       * incremented by one. It is also a coupling — an operator added to `update` and not
       * mirrored here diverges silently — which `features/events/outbox.feature` guards.
       */
      const state = { ...origin, ...changeset, VERSION: origin.VERSION + 1 }

      // an assignment's event is the write's own images, so they are filled in here whether
      // or not the row is going to be committed
      if (row !== undefined) row.event = { origin, state, ...row.event }

      if (row !== undefined && this.#outbox !== undefined)
        await this.#outbox.insert(row, session)

      return state
    }

    if (row === undefined || this.#outbox === undefined) return apply(undefined)

    return this.#client.transaction(apply)
  }

  async ensure(query, properties, state, row = undefined) {
    let { criteria, options } = translate(query, this.#dates)

    if (query === undefined) criteria = properties

    const update = { $setOnInsert: this.#to(state) }

    options.upsert = true
    options.returnDocument = ReturnDocument.AFTER

    try {
      const result =
        row === undefined || this.#outbox === undefined
          ? await this.command('findOneAndUpdate', { criteria, update, options }, () =>
              this.#collection.findOneAndUpdate(criteria, update, options)
            )
          : await this.#client.transaction(async (session) => {
              const found = await this.command(
                'findOneAndUpdate',
                { criteria, update, options },
                () =>
                  this.#collection.findOneAndUpdate(criteria, update, {
                    ...options,
                    session
                  })
              )

              // only an insert is an event; finding an existing record is not
              if (found !== null && found._id === state.id)
                await this.#outbox.insert(row, session)

              return found
            })

      if (result.DELETED !== undefined && result.DELETED !== null) return null
      else return this.#from(result)
    } catch (error) {
      if (error.code === ERR_DUPLICATE_KEY)
        throw new exceptions.DuplicateException(this.#client.name)
      else throw error
    }
  }

  /**
   * Names, logs and times a call into the driver. The driver's own command monitoring is
   * off (see `client.js`), so this is where a query becomes a span.
   *
   * @private
   */
  async command(method, attributes, task) {
    this.debug(method, attributes)

    return console.span(this.span(method), task)
  }

  /**
   * The span of a driver method is the same object every time: the collection is fixed
   * for a storage, and nothing downstream writes to what it is given.
   *
   * @private
   */
  span(method) {
    let options = this.#spans.get(method)

    if (options === undefined) {
      const collection = this.#collection.collectionName

      options = {
        name: `${method} ${collection}`,
        kind: 'client',
        // https://opentelemetry.io/docs/specs/semconv/database/mongodb/
        attributes: {
          'db.system': 'mongodb',
          'db.namespace': this.#collection.dbName,
          'db.operation.name': method,
          'db.collection.name': collection
        }
      }

      this.#spans.set(method, options)
    }

    return options
  }

  debug(method, attributes) {
    console.debug('MongoDB query', {
      collection: this.#collection.collectionName,
      method,
      ...attributes
    })
  }
}

function toPipeline(criteria, options, sample) {
  const pipeline = []

  if (criteria !== undefined) pipeline.push({ $match: criteria })

  if (sample !== undefined) pipeline.push({ $sample: { size: sample } })

  if (options?.sort !== undefined) pipeline.push({ $sort: options.sort })

  if (options?.projection !== undefined) pipeline.push({ $project: options.projection })

  return pipeline
}

/** the rank of the first region, which is what a record written before regions reads as */
const FIRST = 0

const ERR_DUPLICATE_KEY = 11000

async function retriable(error, attempt) {
  if (error.code === ERR_DUPLICATE_KEY) {
    const id =
      error.keyPattern === undefined
        ? error.message.includes(' index: _id_ ') // AWS DocumentDB
        : error.keyPattern._id === 1

    if (id) return false
    else throw new exceptions.DuplicateException()
  } else if (error.cause?.code === 'ECONNREFUSED') {
    if (attempt === LAST_ATTEMPT) throw error

    const timeout = 1000 + 500 * attempt

    await new Promise((resolve) => setTimeout(resolve, timeout))

    return true
  } else throw error
}

const LAST_ATTEMPT = 9
