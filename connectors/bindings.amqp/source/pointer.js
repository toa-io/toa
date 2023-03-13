'use strict'

const { Pointer: Base } = require('@toa.io/pointer')
const { PREFIX } = require('./constants')

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
