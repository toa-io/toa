'use strict'

const { generate } = require('randomstring')

const binding = {
  emit: jest.fn(async () => null)
}

const events = [0, 1, 2].map((index) => ({
  label: 'event' + index,
  conditioned: true,
  subjective: true,
  condition: jest.fn(async (origin, changeset) => changeset.conditionFail !== index),
  payload: jest.fn(async (state) => ({ ...state, event: index }))
}))

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

exports.binding = binding
exports.events = events
exports.event = event
