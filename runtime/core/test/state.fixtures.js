'use strict'

const { generate } = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: generate() })),
  find: jest.fn(() => ([{ id: generate() }])),
  add: jest.fn(() => true),
  set: jest.fn(() => true),
  store: jest.fn(() => true)
}

const factory = {
  entity: jest.fn(() => ({ [generate()]: generate() })),
  set: jest.fn(() => ({ [generate()]: generate() }))
}

const query = generate()

const entity = {
  get: jest.fn(() => ({ [generate()]: generate() })),
  event: jest.fn(() => ({ state: { [generate()]: generate() }, changeset: { [generate()]: generate() } }))
}

const initial = {
  initial: true,
  ...entity
}

const unchanged = {
  ...entity,
  event: jest.fn(() => ({ state: { [generate()]: generate() }, changeset: {} }))
}

const emitter = {
  emit: jest.fn()
}

exports.storage = storage
exports.factory = factory
exports.emitter = emitter
exports.query = query
exports.entity = entity
exports.initial = initial
exports.unchanged = unchanged
