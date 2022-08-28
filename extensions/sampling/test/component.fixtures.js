'use strict'

const { generate } = require('randomstring')

const component = {
  invoke: jest.fn(() => ({ output: generate() })),
  link: jest.fn()
}

exports.component = component
