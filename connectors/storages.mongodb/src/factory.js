'use strict'

const { Locator } = require('./locator')
const { Connection } = require('./connection')
const { Storage } = require('./storage')

/**
 * @implements {toa.core.storages.Factory}
 */
class Factory {
  storage (locator) {
    const url = new Locator(locator)
    const connection = new Connection(url)

    return new Storage(connection)
  }
}

exports.Factory = Factory
