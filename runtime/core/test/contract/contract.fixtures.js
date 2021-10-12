'use strict'

const { generate } = require('randomstring')

const schema = {
  fit: jest.fn((input) => input.invalid ? { message: generate() } : null)
}

const query = {
  parse: jest.fn(() => ({ [generate()]: generate() }))
}

const declaration = {}

const schemas = {
  request: { properties: { query: expect.any(Object) }, additionalProperties: false }
}

exports.schema = schema
exports.query = query
exports.declaration = declaration
exports.schemas = schemas
