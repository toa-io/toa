'use strict'

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.storages.mongo.Locator}
 */
class Locator extends URL {
  db
  collection

  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super('mongodb://')

    this.hostname = process.env.TOA_ENV === 'local' ? 'localhost' : locator.host('storages-mongodb')
    this.db = locator.domain
    this.collection = locator.name
  }
}

exports.Locator = Locator
