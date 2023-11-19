'use strict'

const { Connection } = require('./connection')
const { Storage } = require('./storage')

class Factory {
  storage (locator) {
    const connection = new Connection(locator)

    return new Storage(connection)
  }
}

exports.Factory = Factory
