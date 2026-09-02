'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const definition = {
  conditioned: true,
  subjective: true
}

// noinspection JSCheckFunctionSignatures
const bridge = {
  condition: mock.fn(async (origin) => !origin.falsy),
  payload: mock.fn(async () => ({ [generate()]: generate() }))
}

const binding = {
  emit: mock.fn()
}

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

exports.bridge = bridge
exports.binding = binding
exports.definition = definition
exports.event = event
