'use strict'

const { Connector, exceptions } = require('@toa.io/core')
const { console } = require('openspan')
const { translate } = require('./translate')
const { to, from } = require('./record')
const { Outbox } = require('./outbox')
const { ReturnDocument } = require('mongodb')

class Storage extends Connector {
  #client

  /** @type {import('mongodb').Collection} */
  #collection
  #entity

  /**
   * @type {Outbox | undefined} absent when nothing consumes this component's events, or when
   * the deployment cannot run transactions
   */
  #outbox

  /** @type {Map<string, object>} span options per driver method */
  #spans = new Map()

  constructor (client, entity) {
    super()

    this.#client = client
    this.#entity = entity

    this.depends(client)
  }

  get raw () {
    return this.#collection
  }

  /**
   * The outbox is offered only where a row can be committed atomically with the entity.
   * Without that it would be a second write with a window in front of it — worse than the
   * inline emission it replaces — so the storage simply does not advertise it.
   */
  get outbox () {
    return this.#outbox
  }

  async open () {
    this.#collection = this.#client.collection

    if (this.#client.outbox !== undefined)
      this.#outbox = new Outbox(this.#client.outbox)

    this.#spans.clear()

    await this.index()
    await this.#outbox?.index()
  }

  async get (query) {
    const { criteria, options } = translate(query)

    // identity lookups must return deleted records, so that callers
    // can tell a deleted entity from a missing one
    if (query?.id === undefined && query?.options?.deleted !== true)
      criteria._deleted = null

    const record = await this.command('findOne', { criteria, options },
      () => this.#collection.findOne(criteria, options))

    return from(record)
  }

  async find (query) {
    const { criteria, options, sample } = translate(query)

    if (query?.options?.deleted !== true)
      criteria._deleted = null

    const recordset = sample === undefined
      ? await this.command('find', { criteria, options },
        async () => await this.#collection.find(criteria, options).toArray())
      : await this.aggregate(criteria, options, sample)

    return recordset.map((item) => from(item))
  }

  /** @private */
  async aggregate (criteria, options, sample) {
    const pipeline = toPipeline(criteria, options, sample)

    return await this.command('aggregate', { pipeline },
      async () => await this.#collection.aggregate(pipeline).toArray())
  }

  async stream (query = undefined) {
    const { criteria, options } = translate(query)

    if (query?.options?.deleted !== true)
      criteria._deleted = null

    this.debug('find (stream)', { criteria, options })

    return this.#collection.find(criteria, options).stream({ transform: from })
  }

  async add (entity, session = undefined) {
    const record = to(entity)

    const result = await this.command('insertOne', { record },
      () => this.#collection.insertOne(record, { session }))

    return result.acknowledged
  }

  async set (entity, session = undefined) {
    const criteria = {
      _id: entity.id,
      _version: entity._version - 1
    }

    const record = to(entity)

    const result = await this.command('findOneAndReplace', { criteria, record },
      () => this.#collection.findOneAndReplace(criteria, record, { session }))

    return result !== null
  }

  async store (entity, row = undefined, attempt = 0) {
    try {
      if (row === undefined || this.#outbox === undefined) {
        if (entity._version === 1)
          return await this.add(entity)
        else
          return await this.set(entity)
      }

      const committed = await this.#client.transaction(async (session) => {
        const ok = entity._version === 1
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

      if (retry)
        return await this.store(entity, row, attempt + 1)
      else
        return false
    }
  }

  async massStore (entities, rows = undefined, attempt = 0) {
    if (entities.length === 0)
      return true

    const operations = entities.map((entity) => {
      const record = to(entity)

      if (entity._version === 1) {
        const { _version, ...rest } = record

        return { // upsert in required when document is deleted
          updateOne: {
            filter: { _id: entity.id },
            update: {
              $set: {    
                ...rest,
                _deleted: null
              },
              $inc: { _version: 1 },
            },
            upsert: true
          } 
        }
      } else
        return {  
          replaceOne: { 
            filter: { _id: entity.id, _version: entity._version - 1 },
            replacement: record
          }
        }
    })

    try {
      await this.#client.transaction(async (session) => {
        await this.command('bulkWrite', { operations: operations.length },
          async () => await this.#collection.bulkWrite(operations, { session }))

        if (rows !== undefined && this.#outbox !== undefined)
          await this.#outbox.insertMany(rows, session)
      })

      return true
    } catch (error) {
      console.error('MongoDB error', error)

      const retry = await retriable(error, attempt)

      if (retry)
        return await this.massStore(entities, rows, attempt + 1)
      else
        return false
    }
  }

  async upsert (query, changeset, row = undefined) {
    const { criteria, options } = translate(query)

    if (!('_deleted' in changeset) || changeset._deleted === null) {
      delete criteria._deleted
      changeset._deleted = null
    }

    const update = {
      $set: { ...changeset },
      $inc: { _version: 1 }
    }

    // BEFORE, so that the filter is applied once and atomically and the pre-image comes back
    // with it — an assignment is the one event whose images are the write's own
    options.returnDocument = ReturnDocument.BEFORE

    const apply = async (session) => {
      const found = await this.command('findOneAndUpdate', { criteria, update, options },
        () => this.#collection.findOneAndUpdate(criteria, update, { ...options, session }))

      if (found === null) return null

      const origin = from(found)

      /*
       * The post-image is `update` applied to the pre-image, computed rather than read back.
       * That is exact, not approximate: `$set` on top-level keys is a spread (entity property
       * names cannot contain dots, so a changeset never carries a path), and `_version` is
       * incremented by one. It is also a coupling — an operator added to `update` and not
       * mirrored here diverges silently — which `features/events/outbox.feature` guards.
       */
      const state = { ...origin, ...changeset, _version: origin._version + 1 }

      // an assignment's event is the write's own images, so they are filled in here whether
      // or not the row is going to be committed
      if (row !== undefined)
        row.event = { origin, state, ...row.event }

      if (row !== undefined && this.#outbox !== undefined)
        await this.#outbox.insert(row, session)

      return state
    }

    if (row === undefined || this.#outbox === undefined)
      return apply(undefined)

    return this.#client.transaction(apply)
  }

  async ensure (query, properties, state, row = undefined) {
    let { criteria, options } = translate(query)

    if (query === undefined)
      criteria = properties

    const update = { $setOnInsert: to(state) }

    options.upsert = true
    options.returnDocument = ReturnDocument.AFTER

    try {
      const result = row === undefined || this.#outbox === undefined
        ? await this.command('findOneAndUpdate', { criteria, update, options },
          () => this.#collection.findOneAndUpdate(criteria, update, options))
        : await this.#client.transaction(async (session) => {
          const found = await this.command('findOneAndUpdate', { criteria, update, options },
            () => this.#collection.findOneAndUpdate(criteria, update, { ...options, session }))

          // only an insert is an event; finding an existing record is not
          if (found !== null && found._id === state.id)
            await this.#outbox.insert(row, session)

          return found
        })

      if (result._deleted !== undefined && result._deleted !== null)
        return null
      else
        return from(result)
    } catch (error) {
      if (error.code === ERR_DUPLICATE_KEY)
        throw new exceptions.DuplicateException(this.#client.name)
      else
        throw error
    }
  }

  /** A component does not start before this returns, so the indexes are created at once. */
  async index () {
    const pending = []

    if (this.#entity.unique !== undefined)
      for (const [name, fields] of Object.entries(this.#entity.unique)) {
        const optional = this.getOptional(fields)

        pending.push(this.uniqueIndex(name, fields, optional))
      }

    if (this.#entity.index !== undefined)
      for (const [suffix, declaration] of Object.entries(this.#entity.index)) {
        const name = 'index_' + suffix
        const fields = Object.fromEntries(Object.entries(declaration)
          .map(([name, type]) => [name, INDEX_TYPES[type] ?? type]))

        const optional = this.getOptional(Object.keys(fields))
        const options = { name, sparse: optional.length > 0 }

        console.info('Creating index', { fields, options })

        pending.push(this.#collection.createIndex(fields, options)
          .catch((e) => console.warn('MongoDB index creation failed', { collection: this.#collection.collectionName, name, fields, error: e }))
          .then(() => name))
      }

    const indexes = await Promise.all(pending)

    await this.removeObsoleteIndexes(indexes)
  }

  async uniqueIndex (name, properties, optional) {
    const fields = properties.reduce((acc, property) => {
      acc[property] = 1
      return acc
    }, {})

    name = 'unique_' + name

    const options = { name, unique: true }

    if (optional.length > 0)
      options.partialFilterExpression = Object.fromEntries(optional.map((field) => [field, { $exists: true }]))

    console.info('Creating unique index', { name, fields, options })

    await this.#collection.createIndex(fields, options)
      .catch((e) => console.warn('MongoDB unique index creation failed', 
        { collection: this.#collection.collectionName, name, fields, error: e }))

    return name
  }

  async removeObsoleteIndexes (desired) {
    const current = await this.getCurrentIndexes()
    const obsolete = current.filter((name) => !desired.includes(name))

    if (obsolete.length > 0) {
      console.info('Removing obsolete indexes', { collection: this.#collection.collectionName, indexes: obsolete.join(', ') })

      await Promise.all(obsolete.map((name) => this.#collection.dropIndex(name)))
    }
  }

  async getCurrentIndexes () {
    try {
      const array = await this.#collection.listIndexes().toArray()

      return array.map(({ name }) => name).filter((name) => name !== '_id_')
    } catch {
      return []
    }
  }

  getOptional (fields) {
    const optional = []

    for (const field of fields) {      
      if (!field.includes('.') && !(field in this.#entity.schema.properties))
        throw new Error(`Index field '${field}' is not defined.`)

      if (!this.#entity.schema.required?.includes(field))
        optional.push(field)
    }

    return optional
  }

  /**
   * Names, logs and times a call into the driver. The driver's own command monitoring is
   * off (see `client.js`), so this is where a query becomes a span.
   *
   * @private
   */
  async command (method, attributes, task) {
    this.debug(method, attributes)

    return console.span(this.span(method), task)
  }

  /**
   * The span of a driver method is the same object every time: the collection is fixed
   * for a storage, and nothing downstream writes to what it is given.
   *
   * @private
   */
  span (method) {
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

  debug (method, attributes) {
    console.debug('MongoDB query', {
      collection: this.#collection.collectionName,
      method,
      ...attributes
    })
  }
}

function toPipeline (criteria, options, sample) {
  const pipeline = []

  if (criteria !== undefined)
    pipeline.push({ $match: criteria })

  if (sample !== undefined)
    pipeline.push({ $sample: { size: sample } })

  if (options?.sort !== undefined)
    pipeline.push({ $sort: options.sort })

  if (options?.projection !== undefined)
    pipeline.push({ $project: options.projection })

  return pipeline
}

const INDEX_TYPES = {
  'asc': 1,
  'desc': -1,
  'hash': 'hashed'
}

const ERR_DUPLICATE_KEY = 11000

async function retriable (error, attempt) {
  if (error.code === ERR_DUPLICATE_KEY) {
    const id = error.keyPattern === undefined
      ? error.message.includes(' index: _id_ ') // AWS DocumentDB
      : error.keyPattern._id === 1

    if (id)
      return false
    else
      throw new exceptions.DuplicateException()
  } else if (error.cause?.code === 'ECONNREFUSED') {
    if (attempt === LAST_ATTEMPT)
      throw error

    const timeout = 1000 + 500 * attempt

    await new Promise((resolve) => setTimeout(resolve, timeout))

    return true
  } else
    throw error
}

const LAST_ATTEMPT = 9

exports.Storage = Storage
