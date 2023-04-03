'use strict'

const { Pointer } = require('@toa.io/pointer')
const { Communication } = require('./communication')

/**
 * @param {string} prefix
 * @param {toa.core.Locator} locator
 * @returns {toa.amqp.Communication}
 */
const connector = (prefix, locator) => {
  const pointer = new Pointer(prefix, locator, OPTIONS)

  return new Communication(pointer.reference)
}

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'amqp:' }

exports.connector = connector
