'use strict'

const { Pointer: Base } = require('@toa.io/libraries/pointer')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.sql.Pointer}
 */
class Pointer extends Base {
  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(PREFIX, locator, OPTIONS)
  }
}

const PREFIX = 'storages-sql'

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'pg:' }

exports.Pointer = Pointer
