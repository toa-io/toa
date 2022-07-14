'use strict'

const { Pointer: Base } = require('@toa.io/libraries/pointer')

const { PREFIX } = require('./constants')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.amqp.Pointer}
 */
class Pointer extends Base {
  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(PREFIX, locator, 'amqp:')
  }
}

exports.Pointer = Pointer
