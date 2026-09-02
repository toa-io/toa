'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const definition = /** @type {toa.norm.component.Receiver} */ {
  operation: generate(),
  conditioned: false,
  adaptive: false
}

const local = /** @type {toa.core.Component} */ {
  locator: { id: 'default.dummy' },
  invoke: mock.fn()
}

// noinspection JSCheckFunctionSignatures
const bridge = /** @type {toa.core.bridges.Event} */ {
  condition: mock.fn(async (payload) => !(payload.reject === true)),
  request: mock.fn(async () => ({ input: generate() }))
}

exports.definition = definition
exports.local = local
exports.bridge = bridge
