'use strict'

const { shards, echo } = require('@toa.io/generic')
const { Pointer } = require('@toa.io/pointer')
const { Communication } = require('./communication')

/**
 * @param {string} prefix
 * @param {toa.core.Locator} locator
 * @returns {toa.amqp.Communication}
 */
const connector = (prefix, locator) => {
  const pointer = new Pointer(prefix, locator, OPTIONS)
  const reference = echo(pointer.reference)
  const references = shards(reference)

  return new Communication(references)
}

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'amqp:' }

exports.connector = connector
