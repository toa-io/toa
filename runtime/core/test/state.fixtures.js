'use strict'

const { generate } = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: generate() })),
  find: jest.fn(() => ([{ id: generate() }])),
  add: jest.fn(() => true),
  set: jest.fn(() => true)
}

const entity = {
  entry: jest.fn(() => ({ [generate()]: generate() })),
  entries: jest.fn(() => ({ [generate()]: generate() }))
}

const query = generate()

const entry = {
  get: jest.fn(() => ({ [generate()]: generate() })),
  event: jest.fn(() => ({ state: { [generate()]: generate() }, changeset: { [generate()]: generate() } }))
}

const initial = {
  initial: true,
  ...entry
}

const unchanged = {
  ...entry,
  event: jest.fn(() => ({ state: { [generate()]: generate() }, changeset: {} }))
}

const emitter = {
  emit: jest.fn()
}

exports.storage = storage
exports.entity = entity
exports.emitter = emitter
exports.query = query
exports.entry = entry
exports.initial = initial
exports.unchanged = unchanged
