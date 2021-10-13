'use strict'

const { Connector } = require('@kookaburra/core')

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
    const result = await this.#client.update(criteria, to(entry))

    return result.value !== null
  }

  async store (entry) {
    return entry._version === 0 ? this.add(entry) : this.set(entry)
  }

  async find (query) {
    const { criteria, options } = translate(query)
    const entries = await this.#client.find(criteria, options)

    return entries.map(from)
  }
}

exports.Storage = Storage
