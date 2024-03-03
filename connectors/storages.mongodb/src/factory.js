'use strict'

const { Client } = require('./client')
const { Collection } = require('./collection')
const { Storage } = require('./storage')

class Factory {
  storage (locator, entity) {
    const client = new Client(locator)
    const connection = new Collection(client)

    return new Storage(connection, entity)
  }
}

exports.Factory = Factory
