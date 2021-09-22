'use strict'

const { generate } = require('randomstring')

const producers = [0, 1, 2].map((index) => ({
  emitter: true,
  emit: jest.fn(async (label, payload) =>
    payload.emissionFail === undefined || index >= payload.emissionFail)
}))

const events = [0, 1, 2].map((index) => ({
  label: 'event' + index,
  conditional: true,
  subjective: true,
  condition: jest.fn(async (origin, changeset) => changeset.conditionFail !== index),
  payload: jest.fn(async (state) => ({ ...state, event: index }))
}))

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() },
  changeset: { [generate()]: generate() }
}

exports.producers = producers
exports.events = events
exports.event = event
