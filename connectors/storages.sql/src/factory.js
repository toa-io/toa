'use strict'

const { Connection } = require('./connection')
const { Client } = require('./client')
const { Storage } = require('./storage')
const { Migration } = require('./migration')

class Factory {
  storage (locator) {
    const connection = new Connection(locator)
    const client = new Client(connection)

    return new Storage(client)
  }

  migration (driver) {
    return new Migration(driver)
  }
}

exports.Factory = Factory
