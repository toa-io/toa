'use strict'

const { Connector } = require('@kookaburra/core')

const { Client } = require('./client')
const { translate } = require('./translate')
const { to, from } = require('./entry')

class Storage extends Connector {
  #client

  constructor (locator) {
    super()

    // TODO: create Factory
    this.#client = new Client(locator.host(Storage.name), locator.domain, locator.name)
    this.depends(this.#client)
  }

  async add (entry) {
    return this.#client.add(to(entry))
  }

  async get (query) {
    const { criteria, options } = Storage.#translate(query)

    const entry = await this.#client.get(criteria, options)

    return from(entry)
  }

  async update (entry) {
    const criteria = { _id: entry.id }

    return this.#client.update(criteria, to(entry))
  }

  async find (query) {
    const { criteria, options } = Storage.#translate(query)

    const entries = await this.#client.find(criteria, options)

    return entries.map(from)
  }

  static #translate (query) {
    return query ? translate(query) : {}
  }
}

exports.Storage = Storage
