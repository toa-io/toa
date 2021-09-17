'use strict'

const randomstring = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: randomstring.generate() })),
  find: jest.fn(() => ([{ id: randomstring.generate() }])),
  add: jest.fn(() => true),
  update: jest.fn(() => true)
}

const entity = {
  entry: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })),
  set: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
}

const query = randomstring.generate()

const entry = {
  get: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
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
