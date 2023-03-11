'use strict'

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const events = [0, 1, 2].map((index) => ({
  emit: jest.fn(async (state) => ({ ...state, event: index }))
}))

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

exports.events = events
exports.event = event
