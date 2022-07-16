'use strict'

const { Pointer } = require('./pointer')
const { Connection } = require('./connection')
const { Storage } = require('./storage')

/**
 * @implements {toa.sql.Factory}
 */
class Factory {
  storage (locator) {
    const pointer = new Pointer(locator)
    const connection = new Connection(pointer)

    return new Storage(connection)
  }
}

exports.Factory = Factory
