'use strict'

const { Connector, Exception } = require('@kookaburra/core')

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

    if (entry === undefined && query.version !== undefined) throw new Exception(Exception.STORAGE_PRECONDITION)

    return from(entry)
  }

  async add (entry) {
    return this.#client.add(to(entry))
  }

  async set (entry) {
    const criteria = { _id: entry.id, _version: entry._version }
    const result = await this.#client.update(criteria, to(entry))

    if (result.ok !== 1) throw new Exception(Exception.STORAGE)
    if (result.value === null) throw new Exception(Exception.STORAGE_POSTCONDITION)
  }

  async find (query) {
    const { criteria, options } = translate(query)
    const entries = await this.#client.find(criteria, options)

    return entries.map(from)
  }
}

exports.Storage = Storage
