'use strict'

const { Client } = require('./client')
const { Storage } = require('./storage')

class Factory {
  storage (locator, entity) {
    const client = new Client(locator)

    return new Storage(client, entity)
  }
}

exports.Factory = Factory
