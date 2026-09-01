'use strict'

const { Client } = require('./client')
const { Storage } = require('./storage')

class Factory {
  storage (locator, entity, options = {}) {
    const client = new Client(locator, options.outbox === true)

    return new Storage(client, entity)
  }
}

exports.Factory = Factory
