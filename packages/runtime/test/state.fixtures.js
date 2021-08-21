'use strict'

const randomstring = require('randomstring')

const storage = {
  name: 'dummy',
  get: jest.fn(() => ({ id: randomstring.generate() })),
  find: jest.fn(() => ([{ id: randomstring.generate() }])),
  persist: jest.fn(() => true)
}

const entity = {
  create: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })),
  set: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
}

const query = randomstring.generate()

exports.storage = storage
exports.entity = entity
exports.query = query
