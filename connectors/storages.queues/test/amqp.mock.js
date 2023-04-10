'use strict'

/**
 * @returns {jest.MockedObject<toa.amqp.Communication>}
 */
const create = () => (/** @type {jest.MockedObject<toa.amqp.Communication>} */ {
  emit: jest.fn(async () => undefined),
  link: jest.fn()
})

/**
 * @returns {jest.MockedObject<toa.amqp.Communication>}
 */
const connector = jest.fn(() => create())

exports.connector = connector
