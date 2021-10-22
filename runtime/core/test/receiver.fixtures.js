'use strict'

const { generate } = require('randomstring')

const definition = {
  transition: generate(),
  conditioned: false,
  adaptive: false
}

const local = {
  invoke: jest.fn()
}

const bridge = {
  condition: jest.fn((payload) => !(payload.reject === true)),
  request: jest.fn(() => generate())
}

exports.definition = definition
exports.local = local
exports.bridge = bridge
