'use strict'

const { generate } = require('randomstring')

const assert = jest.fn(async () => ({
  emit: jest.fn(async () => undefined),
  request: jest.fn(async () => generate()),
  reply: jest.fn(async () => undefined),
  consume: jest.fn(async () => undefined),
  close: jest.fn(async () => undefined)
}))

exports.assert = assert
