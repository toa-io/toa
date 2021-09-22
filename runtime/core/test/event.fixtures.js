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

const declaration = {
  label: generate()
}

exports.bridge = bridge
exports.declaration = declaration
exports.event = event
