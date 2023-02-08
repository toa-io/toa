'use strict'

const channel = () => ({
  consume: jest.fn(async () => undefined),
  deliver: jest.fn(async () => undefined),
  send: jest.fn(async () => undefined),
  close: jest.fn(async () => undefined)
})

/**
 * @returns {jest.MockedObject<toa.comq.Connection>}
 */
const connection = () => (/** @type {jest.MockedObject<toa.comq.Connection>} */ {
  in: jest.fn(async () => channel()),
  out: jest.fn(async () => channel()),
  close: jest.fn(async () => undefined)
})

exports.connection = connection
