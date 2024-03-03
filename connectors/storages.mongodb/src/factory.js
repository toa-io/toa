'use strict'

const { Connection } = require('./connection')
const { Storage } = require('./storage')

class Factory {
  storage (locator, entity) {
    const connection = new Connection(locator)

    return new Storage(connection, entity)
  }
}

exports.Factory = Factory
