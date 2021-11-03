'use strict'

const { Connector } = require('@toa.io/core')

const { Client } = require('./client')
const { translate } = require('./translate')
const { to, from } = require('./record')

class Storage extends Connector {
  #client

  constructor (locator) {
    super()

    const host = locator.host('mongodb')

    // TODO: create Factory, add test for host
    this.#client = new Client(host, locator.domain, locator.name)
    this.depends(this.#client)
  }

  async get (query) {
    const { criteria, options } = translate(query)

    const record = await this.#client.get(criteria, options)

    return from(record)
  }

  async add (entity) {
    let result

    try {
      result = await this.#client.add(to(entity))
    } catch (e) {
      if (e.code === 11000) result = false // duplicate id
      else throw e
    }

    return result
  }

  async set (entity) {
    const criteria = { _id: entity.id, _version: entity._version }
    const result = await this.#client.replace(criteria, to(entity))

    return result.value !== null
  }

  async store (entity) {
    return entity._version === 0 ? this.add(entity) : this.set(entity)
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

    const result = await this.#client.update(criteria, update, options)

    return from(result.value)
  }

  async find (query) {
    const { criteria, options } = translate(query)
    const recordset = await this.#client.find(criteria, options)

    return recordset.map(from)
  }
}

exports.Storage = Storage
