'use strict'

const channel = () => ({
  consume: jest.fn(async () => undefined),
  deliver: jest.fn(async () => undefined),
  send: jest.fn(async () => undefined)
})

/**
 * @returns {jest.MockedObject<toa.messenger.Connection>}
 */
const connection = () => (/** @type {jest.MockedObject<toa.messenger.Connection>} */ {
  in: jest.fn(async () => channel()),
  out: jest.fn(async () => channel())
})

exports.connection = connection
