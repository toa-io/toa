'use strict'

const { Pointer } = require('./pointer')
const { Connection } = require('./connection')
const { Storage } = require('./storage')
const { Migration } = require('./migration')

/**
 * @implements {toa.sql.Factory}
 */
class Factory {
  storage (locator) {
    const pointer = new Pointer(locator)
    const connection = new Connection(pointer)

    return new Storage(connection)
  }

  migration () {
    return new Migration()
  }
}

exports.Factory = Factory
