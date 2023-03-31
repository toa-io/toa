'use strict'

const extensions = require('./extensions')

/**
 * @param {toa.core.Locator} locator
 * @param {string} provider
 * @param {any} properties
 * @returns {toa.core.Storage}
 */
const storage = (locator, provider, properties) => {
  const { Factory } = require(provider)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(locator, properties)

  return extensions.storage(storage)
}

exports.storage = storage
