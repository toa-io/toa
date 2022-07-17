'use strict'

const { Pointer: Base } = require('@toa.io/libraries/pointer')

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
    super(PREFIX, locator, OPTIONS)

    this.db = locator.namespace
    this.collection = locator.name
  }
}

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'mongodb:' }
const PREFIX = 'storages-mongodb'

exports.Pointer = Pointer
