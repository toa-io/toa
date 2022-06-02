'use strict'

/**
 * @param {toa.core.Locator} locator
 * @param {string} storage
 * @returns {toa.core.storages.Storage}
 */
const storage = (locator, storage) => {
  const { Factory } = require(storage)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()

  return factory.storage(locator)
}

exports.storage = storage
