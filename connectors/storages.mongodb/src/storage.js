'use strict'

const { Connector } = require('@toa.io/core')

const { Client } = require('./client')
const { translate } = require('./translate')
const { to, from } = require('./entry')

class Storage extends Connector {
  #client

  constructor (locator) {
    super()

    // TODO: create Factory, add test for host
    this.#client = new Client(locator.host('mongodb'), locator.domain, locator.name)
    this.depends(this.#client)
  }

  async get (query) {
    const { criteria, options } = translate(query)

    const entry = await this.#client.get(criteria, options)

    return from(entry)
  }

  async add (entry) {
    let result

    try {
      result = await this.#client.add(to(entry))
    } catch (e) {
      if (e.code === 11000) result = false // duplicate id
      else throw e
    }

    return result
  }

  async set (entry) {
    const criteria = { _id: entry.id, _version: entry._version }
    const result = await this.#client.replace(criteria, to(entry))

    return result.value !== null
  }

  async store (entry) {
    return entry._version === 0 ? this.add(entry) : this.set(entry)
  }

  async upsert (query, value, insert) {
    const { criteria, options } = translate(query)
    const update = { $set: { ...value }, $inc: { _version: 1 } }

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
    const list = await this.#client.find(criteria, options)

    return list.map(from)
  }
}

exports.Storage = Storage
