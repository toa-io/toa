'use strict'

const { generate } = require('randomstring')

/**
 * @return {jest.MockedObject<comq.IO>}
 */
const io = () => (/** @type {jest.MockedObject<comq.IO>} */ {
  request: jest.fn(async () => generate()),
  reply: jest.fn(async () => undefined),
  emit: jest.fn(async () => undefined),
  consume: jest.fn(async () => undefined),
  seal: jest.fn(async () => undefined),
  close: jest.fn(async () => undefined)
})

const comq = {
  connect: jest.fn(async () => io()),
  assert: jest.fn(async () => io())
}

exports.comq = comq
