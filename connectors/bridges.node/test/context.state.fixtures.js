'use strict'

const { mock } = require('node:test')

const context = {
  apply: mock.fn(),
  call: mock.fn(),
  aspects: [
    {
      name: 'state',
      invoke: mock.fn()
    }
  ],
  link: mock.fn(),
  connect: mock.fn()
}

exports.context = context
