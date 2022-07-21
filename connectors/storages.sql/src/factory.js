'use strict'

const { Pointer } = require('./pointer')
const { Connection } = require('./connection')
const { Client } = require('./client')
const { Storage } = require('./storage')
const { Migration } = require('./migration')

/**
 * @implements {toa.sql.Factory}
 */
class Factory {
  storage (locator) {
    const pointer = new Pointer(locator)
    const connection = new Connection(pointer)
    const client = new Client(connection, pointer)

    return new Storage(client)
  }

  migration (driver) {
    return new Migration(driver)
  }
}

exports.Factory = Factory
