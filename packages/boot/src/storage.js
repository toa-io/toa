'use strict'

const { Storage } = require('@kookaburra/storage')

const storage = (name, locator) => {
  const storage = require(name || DEFAULT_STORAGE)

  if (!storage.Connector) { throw new Error(`Storage '${name}' does not export Connector class`) }

  if (!(storage.Connector.prototype instanceof Storage)) {
    throw new Error(`Storage '${name}' Connector is not instance of Storage class from @kookaburra/storage`)
  }

  return new storage.Connector(locator)
}

const DEFAULT_STORAGE = '@kookaburra/storages.mongodb'

exports.storage = storage
