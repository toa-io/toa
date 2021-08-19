'use strict'

const { Storage } = require('@kookaburra/storage')

const { Client } = require('./client')
const { translate } = require('./query')

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
    return await this.#client.add(entry)
  }

  async get (query) {
    const { criteria, options } = translate(query)

    return await this.#client.get(criteria, options)
  }

  async update (entry) {
    const criteria = { _id: entry._id }

    return await this.#client.update(criteria, entry)
  }
}

exports.Connector = Connector
