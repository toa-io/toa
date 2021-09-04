'use strict'

const randomstring = require('randomstring')

const schema = {
  fit: jest.fn((object) =>
    (object.fail ? { [randomstring.generate()]: randomstring.generate() } : undefined)),

  defaults: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
}

const entry = {
  id: randomstring.generate(),
  foo: randomstring.generate(),
  _created: randomstring.generate(),
  _updated: randomstring.generate(),
  _deleted: randomstring.generate(),
  _version: randomstring.generate()
}

exports.schema = schema
exports.entry = entry
