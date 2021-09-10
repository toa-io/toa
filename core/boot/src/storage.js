'use strict'

const storage = (storage, locator) => {
  const { Storage } = require(storage.connector || DEFAULT_PROVIDER)

  return new Storage(locator)
}

const DEFAULT_PROVIDER = '@kookaburra/storages.mongodb'

exports.storage = storage
