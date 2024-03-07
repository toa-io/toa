'use strict'

const {
  Connector,
  exceptions
} = require('@toa.io/core')

const { translate } = require('./translate')
const {
  to,
  from
} = require('./record')

class Storage extends Connector {
  #connection
  #entity

  constructor (connection, entity) {
    super()

    this.#connection = connection
    this.#entity = entity

    this.depends(connection)
  }

  async open () {
    await this.index()
  }

  async get (query) {
    const {
      criteria,
      options
    } = translate(query)

    const record = await this.#connection.get(criteria, options)

    return from(record)
  }

  async find (query) {
    const {
      criteria,
      options
    } = translate(query)
    const recordset = await this.#connection.find(criteria, options)

    return recordset.map((item) => from(item))
  }

  async add (entity) {
    const record = to(entity)
    const result = await this.#connection.add(record)

    return result.acknowledged
  }

  async set (entity) {
    const criteria = {
      _id: entity.id,
      _version: entity._version - 1
    }
    const result = await this.#connection.replace(criteria, to(entity))

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
    const {
      criteria,
      options
    } = translate(query)

    const update = {
      $set: { ...changeset },
      $inc: { _version: 1 }
    }

    options.returnDocument = 'after'

    const result = await this.#connection.update(criteria, update, options)

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

        await this.#connection.index(fields, {
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

    await this.#connection.index(fields, {
      name,
      unique: true,
      sparse
    })

    return name
  }

  async removeObsolete (desired) {
    const current = await this.#connection.indexes()
    const obsolete = current.filter((name) => !desired.includes(name))

    if (obsolete.length > 0) {
      console.info(`Remove obsolete indexes: [${obsolete.join(', ')}]`)

      await this.#connection.dropIndexes(obsolete)
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
