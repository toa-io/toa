'use strict'

const { generate } = require('randomstring')

const definition = /** @type {toa.norm.component.Receiver} */ {
  transition: generate(),
  conditioned: false,
  adaptive: false
}

const local = /** @type {toa.core.Component} */ {
  invoke: jest.fn()
}

// noinspection JSCheckFunctionSignatures
const bridge = {
  condition: jest.fn((payload) => !(payload.reject === true)),
  request: jest.fn(() => generate())
}

exports.definition = definition
exports.local = local
exports.bridge = bridge
