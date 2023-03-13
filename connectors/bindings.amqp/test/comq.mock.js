'use strict'

/**
 * @return {jest.MockedObject<comq.IO>}
 */
const io = () => (/** @type {jest.MockedObject<comq.IO>} */ {
  reply: jest.fn(async () => undefined),
  seal: jest.fn(async () => undefined),
  close: jest.fn(async () => undefined)
})

const comq = {
  connect: jest.fn(async () => io())
}

exports.comq = comq
