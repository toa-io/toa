'use strict'

const { Storage } = require('@kookaburra/storage')

const { Client } = require('./client')
const { translate } = require('./translate')
const { to, from } = require('./entry')

class Connector extends Storage {
  static name = 'MongoDB'

  #client

  constructor (locator) {
    super()

    this.#client = new Client(Connector.host(locator), locator.domain, locator.entity)
  }

  async connection () {
    await this.#client.connect()
  }

  async disconnection () {
    await this.#client.disconnect()
  }

  async add (entry) {
    return await this.#client.add(to(entry))
  }

  async get (query) {
    const { criteria, options } = Connector.#translate(query)

    const entry = await this.#client.get(criteria, options)

    return from(entry)
  }

  async update (entry) {
    const criteria = { _id: entry.id }

    return await this.#client.update(criteria, to(entry))
  }

  async find (query) {
    const { criteria, options } = Connector.#translate(query)

    const entries = await this.#client.find(criteria, options)

    return entries.map(from)
  }

  static #translate (query) {
    return query ? translate(query) : {}
  }
}

exports.Connector = Connector
