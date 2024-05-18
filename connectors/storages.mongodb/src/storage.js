'use strict'

const { Connector, exceptions } = require('@toa.io/core')

const { translate } = require('./translate')
const { to, from } = require('./record')
const { ReturnDocument } = require('mongodb')

class Storage extends Connector {
  #collection
  #entity

  constructor (connection, entity) {
    super()

    this.#collection = connection
    this.#entity = entity

    this.depends(connection)
  }

  async open () {
    await this.index()
  }

  async get (query) {
    const { criteria, options } = translate(query)
    const record = await this.#collection.get(criteria, options)

    return from(record)
  }

  async find (query) {
    const { criteria, options } = translate(query)
    const recordset = await this.#collection.find(criteria, options)

    return recordset.map((item) => from(item))
  }

  async stream (query = undefined) {
    const { criteria, options } = translate(query)

    return await this.#collection.stream(criteria, options, from)
  }

  async add (entity) {
    const record = to(entity)
    const result = await this.#collection.add(record)

    return result.acknowledged
  }

  async set (entity) {
    const criteria = {
      _id: entity.id,
      _version: entity._version - 1
    }
    const result = await this.#collection.replace(criteria, to(entity))

    return result !== null
  }

  async store (entity) {
    try {
      if (entity._version === 1) {
        return await this.add(entity)
      } else {
        return await this.set(entity)
      }
    } catch (error) {
      if (error.code === ERR_DUPLICATE_KEY) {

        const id = error.keyPattern === undefined
          ? error.message.includes(' index: _id_ ') // AWS DocumentDB
          : error.keyPattern._id === 1

        if (id) {
          return false
        } else {
          throw new exceptions.DuplicateException()
        }
      } else {
        throw error
      }
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

    const result = await this.#collection.update(criteria, update, options)

    return from(result)
  }

  async ensure (query, properties, state) {
    let { criteria, options } = translate(query)

    if (query === undefined)
      criteria = properties

    options.upsert = true
    options.returnDocument = ReturnDocument.AFTER

    const update = {
      $setOnInsert: to(state)
    }

    const result = await this.#collection.update(criteria, update, options)

    if (result._deleted !== undefined && result._deleted !== null)
      return null
    else
      return from(result)
  }

  async index () {
    const indexes = []

    if (this.#entity.unique !== undefined) {
      for (const [name, fields] of Object.entries(this.#entity.unique)) {
        const sparse = this.checkFields(fields)
        const unique = await this.uniqueIndex(name, fields, sparse)

        indexes.push(unique)
      }
    }

    if (this.#entity.index !== undefined) {
      for (const [suffix, declaration] of Object.entries(this.#entity.index)) {
        const name = 'index_' + suffix
        const fields = Object.fromEntries(Object.entries(declaration)
          .map(([name, type]) => [name, INDEX_TYPES[type]]))

        const sparse = this.checkFields(Object.keys(fields))

        await this.#collection.index(fields, {
          name,
          sparse
        })

        indexes.push(name)
      }
    }

    await this.removeObsolete(indexes)
  }

  async uniqueIndex (name, properties, sparse = false) {
    const fields = properties.reduce((acc, property) => {
      acc[property] = 1
      return acc
    }, {})

    name = 'unique_' + name

    await this.#collection.index(fields, {
      name,
      unique: true,
      sparse
    })

    return name
  }

  async removeObsolete (desired) {
    const current = await this.#collection.indexes()
    const obsolete = current.filter((name) => !desired.includes(name))

    if (obsolete.length > 0) {
      console.info(`Remove obsolete indexes: [${obsolete.join(', ')}]`)

      await this.#collection.dropIndexes(obsolete)
    }
  }

  checkFields (fields) {
    const optional = []

    for (const field of fields) {
      if (!(field in this.#entity.schema.properties)) {
        throw new Error(`Index field '${field}' is not defined.`)
      }

      if (!this.#entity.schema.required?.includes(field)) {
        optional.push(field)
      }
    }

    if (optional.length > 0) {
      console.info(`Index fields [${optional.join(', ')}] are optional, creating sparse index.`)

      return true
    } else {
      return false
    }
  }

}

const INDEX_TYPES = {
  'asc': 1,
  'desc': -1,
  'hash': 'hashed'
}

const ERR_DUPLICATE_KEY = 11000

exports.Storage = Storage
