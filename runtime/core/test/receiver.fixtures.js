'use strict'

const { generate } = require('randomstring')

const definition = {
  conditioned: false,
  adaptive: false
}

const apply = {
  apply: jest.fn()
}

const bridge = {
  condition: jest.fn((payload) => !(payload.reject === true)),
  request: jest.fn(() => generate())
}

exports.definition = definition
exports.apply = apply
exports.bridge = bridge
