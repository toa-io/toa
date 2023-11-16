'use strict'

const { Batcher } = require('./batcher')
const { Connection } = require('./connection')
const { Storage } = require('./storage')

class Factory {
  storage (locator) {
    const connection = new Connection(locator)
    const batcher = new Batcher(connection)
    return new Storage(batcher)
  }
}

exports.Factory = Factory
