'use strict'

const { Connector } = require('@toa.io/core')

const { translate } = require('./translate')
const { to, from } = require('./record')

/**
 * @implements {toa.core.storages.Storage}
 */
class Storage extends Connector {
  /** @type {toa.storages.mongo.Connection} */
  #connection

  /**
   * @param {toa.storages.mongo.Connection} connection
   */
  constructor (connection) {
    super()

    this.#connection = connection

    this.depends(connection)
  }

  async get (query) {
    const { criteria, options } = translate(query)

    const record = await this.#connection.get(criteria, options)

    return from(record)
  }

  async find (query) {
    const { criteria, options } = translate(query)
    const recordset = await this.#connection.find(criteria, options)

    return recordset.map((item) => from(item))
  }

  async add (entity) {
    let result

    try {
      result = await this.#connection.add(to(entity))
    } catch (e) {
      if (e.code === 11000) result = false // duplicate id
      else throw e
    }

    return result
  }

  async set (entity) {
    const criteria = { _id: entity.id, _version: entity._version }
    const result = await this.#connection.replace(criteria, to(entity))

    return result.value !== null
  }

  async store (entity) {
    if (entity._version === 0) return this.add(entity)
    else return this.set(entity)
  }

  async upsert (query, changeset, insert) {
    const { criteria, options } = translate(query)
    const update = { $set: { ...changeset }, $inc: { _version: 1 } }

    if (insert !== undefined) {
      delete insert._version

      options.upsert = true

      if (criteria._id !== undefined) insert._id = criteria._id
      else return null // this shouldn't ever happen

      if (Object.keys(insert) > 0) update.$setOnInsert = insert
    }

    options.returnDocument = 'after'

    const result = await this.#connection.update(criteria, update, options)

    return from(result.value)
  }
}

exports.Storage = Storage
