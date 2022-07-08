'use strict'

const { Pointer: Base } = require('@toa.io/libraries/connectors')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.mongodb.Pointer}
 */
class Pointer extends Base {
  db
  collection

  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(locator, 'mongodb:')

    this.hostname = process.env.TOA_ENV === 'local' ? 'localhost' : locator.hostname(PREFIX)

    this.db = locator.namespace
    this.collection = locator.name
  }
}

const PREFIX = 'storages-mongodb'

exports.Pointer = Pointer
