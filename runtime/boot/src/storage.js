'use strict'

const storage = (locator, storage = DEFAULT) => {
  const { Storage } = require(storage)

  return new Storage(locator)
}

const DEFAULT = '@kookaburra/storages.mongodb'

exports.storage = storage
