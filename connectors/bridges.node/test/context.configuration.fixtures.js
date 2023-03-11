'use strict'

const { generate } = require('randomstring')

const configuration = { foo: { bar: generate() } }

const context = /** @type {toa.core.Context} */ {
  apply: jest.fn(),
  call: jest.fn(),
  aspects: [
    {
      name: 'configuration',
      invoke: jest.fn(() => configuration)
    }
  ],
  link: jest.fn(),
  connect: jest.fn()
}

exports.context = context
exports.configuration = configuration
