'use strict'

const { generate } = require('randomstring')

const definition = /** @type {toa.norm.component.Receiver} */ {
  operation: generate(),
  conditioned: false,
  adaptive: false
}

const local = /** @type {toa.core.Component} */ {
  invoke: jest.fn()
}

// noinspection JSCheckFunctionSignatures
const bridge = /** @type {toa.core.bridges.Event} */ {
  condition: jest.fn(async (payload) => !(payload.reject === true)),
  request: jest.fn(async () => ({ input: generate() }))
}

exports.definition = definition
exports.local = local
exports.bridge = bridge
