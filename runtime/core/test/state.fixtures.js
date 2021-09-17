'use strict'

const { generate } = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: generate() })),
  find: jest.fn(() => ([{ id: generate() }])),
  add: jest.fn(() => true),
  update: jest.fn(() => true)
}

const entity = {
  entry: jest.fn(() => ({ [generate()]: generate() })),
  entries: jest.fn(() => ({ [generate()]: generate() }))
}

const query = generate()

const entry = {
  get: jest.fn(() => ({ [generate()]: generate() }))
}

const initial = {
  initial: true,
  ...entry
}

exports.storage = storage
exports.entity = entity
exports.query = query
exports.entry = entry
exports.initial = initial
