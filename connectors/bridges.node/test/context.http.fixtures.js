'use strict'

const context = /** @type {toa.core.Context} */ {
  apply: jest.fn(),
  call: jest.fn(),
  aspects: [
    {
      name: 'http',
      invoke: jest.fn()
    }
  ],
  link: jest.fn(),
  connect: jest.fn()
}

exports.context = context
