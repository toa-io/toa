'use strict'

const { Pointer: Base } = require('@toa.io/pointer')

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
    super(PREFIX, locator, OPTIONS)
  }
}

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'amqp:' }

exports.Pointer = Pointer
