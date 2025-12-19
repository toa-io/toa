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

    await this.index()
  }

  async get (query) {
    const { criteria, options } = translate(query)

    this.debug('findOne', { criteria, options })

    const record = await this.#collection.findOne(criteria, options)

    return from(record)
  }

  async find (query) {
    const { criteria, options, sample } = translate(query)

    criteria._deleted = null

    let cursor

    if (sample === undefined) {
      this.debug('find', { criteria, options })

      cursor = this.#collection.find(criteria, options)
    } else {
      const pipeline = toPipeline(criteria, options, sample)

      this.debug('aggregate', { pipeline })

      cursor = this.#collection.aggregate(pipeline)
    }

    const recordset = await cursor.toArray()

    return recordset.map((item) => from(item))
  }

  async stream (query = undefined) {
    const { criteria, options } = translate(query)

    this.debug('find (stream)', { criteria, options })

    return this.#collection.find(criteria, options).stream({ transform: from })
  }

  async add (entity) {
    const record = to(entity)

    this.debug('insertOne', { record })

    const result = await this.#collection.insertOne(record)

    return result.acknowledged
  }

  async set (entity) {
    const criteria = {
      _id: entity.id,
      _version: entity._version - 1
    }

    const record = to(entity)

    this.debug('findOneAndReplace', { criteria, record })

    const result = await this.#collection.findOneAndReplace(criteria, record)

    return result !== null
  }

  async store (entity, attempt = 0) {
    try {
      if (entity._version === 1)
        return await this.add(entity)
      else
        return await this.set(entity)
    } catch (error) {
      if (error.code === ERR_DUPLICATE_KEY) {
        const id = error.keyPattern === undefined
          ? error.message.includes(' index: _id_ ') // AWS DocumentDB
          : error.keyPattern._id === 1

        if (id)
          return false
        else
          throw new exceptions.DuplicateException(this.#client.name, entity)
      } else if (error.cause?.code === 'ECONNREFUSED') {
        // This is temporary and should be replaced with a class decorator.
        if (attempt > 10)
          throw error

        await new Promise((resolve) => setTimeout(resolve, 1000))

        return this.store(entity)
      } else
        throw error
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

    this.debug('findOneAndUpdate', { criteria, update, options })

    const result = await this.#collection.findOneAndUpdate(criteria, update, options)

    return from(result)
  }

  async ensure (query, properties, state) {
    let { criteria, options } = translate(query)

    if (query === undefined)
      criteria = properties

    const update = { $setOnInsert: to(state) }

    options.upsert = true
    options.returnDocument = ReturnDocument.AFTER

    console.debug('Database query', { collection: this.#collection.name, method: 'findOneAndUpdate', criteria, update, options })

    const result = await this.#collection.findOneAndUpdate(criteria, update, options)

    if (result._deleted !== undefined && result._deleted !== null)
      return null
    else
      return from(result)
  }

  async index () {
    const indexes = []

    if (this.#entity.unique !== undefined) {
      for (const [name, fields] of Object.entries(this.#entity.unique)) {
        const optional = this.getOptional(fields)
        const unique = await this.uniqueIndex(name, fields, optional)

        indexes.push(unique)
      }
    }

    if (this.#entity.index !== undefined) {
      for (const [suffix, declaration] of Object.entries(this.#entity.index)) {
        const name = 'index_' + suffix
        const fields = Object.fromEntries(Object.entries(declaration)
          .map(([name, type]) => [name, INDEX_TYPES[type] ?? type]))

        const optional = this.getOptional(Object.keys(fields))
        const options = { name, sparse: optional.length > 0 }

        console.info('Creating index', { fields, options })

        await this.#collection.createIndex(fields, options)
          .catch((e) => console.warn('MongoDB index creation failed', { collection: this.#collection.name, name, fields, error: e }))

        indexes.push(name)
      }
    }

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
        { collection: this.#collection.name, name, fields, error: e }))

    return name
  }

  async removeObsoleteIndexes (desired) {
    const current = await this.getCurrentIndexes()
    const obsolete = current.filter((name) => !desired.includes(name))

    if (obsolete.length > 0) {
      console.info('Removing obsolete indexes', { collection: this.#collection.name, indexes: obsolete.join(', ') })

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

  debug (method, attributes) {
    console.debug('Database query', {
      collection: this.#collection.name,
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

exports.Storage = Storage
