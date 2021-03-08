'use strict'

const randomstring = require('randomstring')

const id = randomstring.generate()

const validator = {
  error: jest.fn(() => randomstring.generate()),
  errors: randomstring.generate(),
  validate: jest.fn((id, value) => {
    if (value === 'additional') { return }

    return typeof value === 'string'
  }),
  defaults: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() }))
}

exports.id = id
exports.validator = validator
