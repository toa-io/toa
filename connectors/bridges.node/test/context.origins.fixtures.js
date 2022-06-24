'use strict'

const context = {
  apply: jest.fn(),
  call: jest.fn(),
  extensions: [
    {
      name: 'origins',
      invoke: jest.fn()
    }
  ],
  link: jest.fn()
}

exports.context = context
