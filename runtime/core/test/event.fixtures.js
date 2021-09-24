'use strict'

const { generate } = require('randomstring')

const bridge = {
  condition: jest.fn(async () => true),
  payload: jest.fn(async (state) => state)
}

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

const definition = {
  conditioned: false
}

exports.bridge = bridge
exports.label = generate()
exports.definition = definition
exports.event = event
