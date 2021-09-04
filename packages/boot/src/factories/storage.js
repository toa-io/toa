'use strict'

const storage = (name, locator) => {
  const { Storage } = require(name || DEFAULT_STORAGE)

  return new Storage(locator)
}

const DEFAULT_STORAGE = '@kookaburra/storages.mongodb'

exports.storage = storage
