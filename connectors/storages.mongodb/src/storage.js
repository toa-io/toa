'use strict'

const { Connector, exceptions } = require('@toa.io/core')
const { console } = require('openspan')
const { translate } = require('./translate')
const { to, from } = require('./record')
const { ReturnDocument } = require('mongodb')

class Storage extends Connector {
  #client

  /** @type {import('mongodb').Collection} */
  #collection
  #entity

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

  async open () {
    this.#collection = this.#client.collection

    this.#spans.clear()

    await this.index()
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

  async add (entity) {
    const record = to(entity)

    const result = await this.command('insertOne', { record },
      () => this.#collection.insertOne(record))

    return result.acknowledged
  }

  async set (entity) {
    const criteria = {
      _id: entity.id,
      _version: entity._version - 1
    }

    const record = to(entity)

    const result = await this.command('findOneAndReplace', { criteria, record },
      () => this.#collection.findOneAndReplace(criteria, record))

    return result !== null
  }

  async store (entity, attempt = 0) {
    try {
      if (entity._version === 1)
        return await this.add(entity)
      else
        return await this.set(entity)
    } catch (error) {
      console.error('MongoDB error', error)

      const retry = await retriable(error, attempt)

      if (retry)
        return await this.store(entity, attempt + 1)
      else
        return false
    }
  }

  async massStore (entities, attempt = 0) {
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

    const client = this.#client.instance.client

    try {
      await client.withSession(async (session) => {
        await session.withTransaction(async () =>
          await this.command('bulkWrite', { operations: operations.length },
            async () => await this.#collection.bulkWrite(operations, { session })))
      })

      return true
    } catch (error) {
      console.error('MongoDB error', error)

      const retry = await retriable(error, attempt)

      if (retry)
        return await this.massStore(entities, attempt + 1)
      else
        return false
    }
  }

  async upsert (query, changeset) {
    const { criteria, options } = translate(query)

    if (!('_deleted' in changeset) || changeset._deleted === null) {
      delete criteria._deleted
      changeset._deleted = null
    }

    const update = {
      $set: { ...changeset },
      $inc: { _version: 1 }
    }

    options.returnDocument = ReturnDocument.AFTER

    const result = await this.command('findOneAndUpdate', { criteria, update, options },
      () => this.#collection.findOneAndUpdate(criteria, update, options))

    return from(result)
  }

  async ensure (query, properties, state) {
    let { criteria, options } = translate(query)

    if (query === undefined)
      criteria = properties

    const update = { $setOnInsert: to(state) }

    options.upsert = true
    options.returnDocument = ReturnDocument.AFTER

    try {
      const result = await this.command('findOneAndUpdate', { criteria, update, options },
        () => this.#collection.findOneAndUpdate(criteria, update, options))

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
