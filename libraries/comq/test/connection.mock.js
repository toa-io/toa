'use strict'

const channel = () => ({
  consume: jest.fn(async () => undefined),
  deliver: jest.fn(async () => undefined),
  send: jest.fn(async () => undefined),
  subscribe: jest.fn(async () => undefined),
  publish: jest.fn(async () => undefined),
  diagnose: jest.fn(async () => undefined),
  seal: jest.fn(async () => undefined)
})

/**
 * @returns {jest.MockedObject<comq.Connection>}
 */
const connection = () => (/** @type {jest.MockedObject<comq.Connection>} */ {
  createInputChannel: jest.fn(async () => channel()),
  createOutputChannel: jest.fn(async () => channel()),
  close: jest.fn(async () => undefined),
  diagnose: jest.fn(() => undefined)
})

exports.connection = connection
