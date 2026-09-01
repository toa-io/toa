'use strict'

const { generate } = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: generate() })),
  find: jest.fn(() => ([{ id: generate() }])),
  add: jest.fn(() => true),
  set: jest.fn(() => true),
  store: jest.fn(() => true),
  massStore: jest.fn(() => true),
  upsert: jest.fn(() => ({ id: generate() })),
  ensure: jest.fn((query, properties, state) => state)
}

const factory = {
  object: jest.fn(() => ({ [generate()]: generate() })),
  objects: jest.fn(() => ({ [generate()]: generate() }))
}

const query = generate()

const entity = {
  get: jest.fn(() => ({ [generate()]: generate() })),
  event: jest.fn(() => ({ state: { [generate()]: generate() } }))
}

const initial = {
  initial: true, ...entity
}

const unchanged = {
  ...entity,
  event: jest.fn(() => ({ state: { [generate()]: generate() } }))
}

// a legacy outbox: no storage capability, so `publish` emits inline
const outbox = {
  row: jest.fn((event) => ({ id: generate(), lane: 0, published: false, pending: 0, event })),
  publish: jest.fn()
}

exports.storage = storage
exports.factory = factory
exports.outbox = outbox
exports.query = query
exports.entity = entity
exports.initial = initial
exports.unchanged = unchanged
