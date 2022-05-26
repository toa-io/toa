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

    if (process.env.TOA_ENV === 'local') {
      this.hostname = 'localhost'
    } else {
      this.hostname = locator.host('storage', 0)
    }

    this.db = locator.domain
    this.collection = locator.name
  }
}

exports.Locator = Locator
