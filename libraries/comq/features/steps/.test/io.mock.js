'use strict'

const { generate } = require('randomstring')

const io = /** @type {jest.MockedObject<comq.IO>} */ {
  reply: jest.fn(async () => undefined),
  request: jest.fn(async () => generate()),
  close: jest.fn(async () => undefined)
}

exports.io = io
