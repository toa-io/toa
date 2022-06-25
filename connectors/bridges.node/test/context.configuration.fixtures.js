'use strict'

const { generate } = require('randomstring')

const configuration = { foo: { bar: generate() } }

const context = {
  apply: jest.fn(),
  call: jest.fn(),
  extensions: [
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
