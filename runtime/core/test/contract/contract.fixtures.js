'use strict'

const { generate } = require('randomstring')

const schema = {
  fit: jest.fn((input) => input.invalid ? { message: generate() } : undefined)
}

const query = {
  parse: jest.fn(() => ({ [generate()]: generate() }))
}

exports.schema = schema
exports.query = query
