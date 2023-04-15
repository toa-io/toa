'use strict'

const context = {
  apply: jest.fn(),
  call: jest.fn(),
  aspects: [
    {
      name: 'state',
      invoke: jest.fn()
    }
  ],
  link: jest.fn(),
  connect: jest.fn()
}

exports.context = context
