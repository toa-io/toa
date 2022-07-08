'use strict'

/**
 * @implements {toa.storages.mongo.Locator}
 */
class Locator {
  href
  hostname
  db
  collection

  #url

  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    this.#url = new URL('mongodb://')
    this.#url.hostname = process.env.TOA_ENV === 'local' ? 'localhost' : locator.hostname('storages-mongodb')

    this.href = this.#url.href
    this.hostname = this.#url.hostname
    this.db = locator.namespace
    this.collection = locator.name
  }
}

exports.Locator = Locator
