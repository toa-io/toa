'use strict'

const { Storage } = require('@kookaburra/storage')

const { Client } = require('./client')

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

  async add (object) {
    return await this.#client.add(object)
  }
}

exports.Connector = Connector
