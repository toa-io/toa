'use strict'

const { Pointer } = require('@toa.io/pointer')
const { Communication } = require('./communication')

/**
 * @param {string} prefix
 * @param {toa.core.Locator} locator
 * @returns {toa.amqp.Communication}
 */
const connector = (prefix, locator) => {
  const pointer = /** @type {toa.pointer.Pointer} */ new Pointer(prefix, locator, OPTIONS)

  return new Communication(pointer)
}

const OPTIONS = { protocol: 'amqp:' }

exports.connector = connector
