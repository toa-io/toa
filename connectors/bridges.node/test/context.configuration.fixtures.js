'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const configuration = { foo: { bar: generate() } }

const context = /** @type {toa.core.Context} */ {
  apply: mock.fn(),
  call: mock.fn(),
  aspects: [
    {
      name: 'configuration',
      invoke: mock.fn(() => configuration)
    }
  ],
  link: mock.fn(),
  connect: mock.fn()
}

exports.context = context
exports.configuration = configuration
