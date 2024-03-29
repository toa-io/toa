'use strict'

const { generate } = require('randomstring')

const definition = {
  conditioned: true,
  subjective: true
}

// noinspection JSCheckFunctionSignatures
const bridge = {
  condition: jest.fn(async (origin) => !origin.falsy),
  payload: jest.fn(async () => ({ [generate()]: generate() }))
}

const binding = {
  emit: jest.fn()
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
