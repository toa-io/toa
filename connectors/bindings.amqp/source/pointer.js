'use strict'

const { Pointer: Base } = require('@toa.io/pointer')

class Pointer extends Base {
  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(PREFIX, locator, OPTIONS)
  }
}

const PREFIX = 'bindings-amqp'

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'amqp:' }

exports.Pointer = Pointer
