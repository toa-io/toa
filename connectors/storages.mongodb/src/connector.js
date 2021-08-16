'use strict'

const { Storage } = require('@kookaburra/storage')
const { console } = require('@kookaburra/gears')

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

  async get () {
    return { _id: '123', _created: 1, _updated: 1, _deleted: 1, _version: 0, name: 'test' }
  }

  async find () {
    return [{ _id: '123', _created: 1, _updated: 1, _deleted: 1, _version: 0, name: 'test' }]
  }

  async persist (document) {
    console.log('persist', document)
    return true
  }
}

exports.Connector = Connector
