'use strict'

const extensions = require('./extensions')

/**
 * @param {toa.core.Locator} locator
 * @param {string} provider
 * @returns {toa.core.Storage}
 */
const storage = (locator, provider) => {
  const { Factory } = require(provider)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(locator)

  return extensions.storage(storage)
}

exports.storage = storage
