'use strict'

const storage = (locator, storage) => {
  const { Storage } = require(storage)

  return new Storage(locator)
}

exports.storage = storage
