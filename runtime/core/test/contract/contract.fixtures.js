'use strict'

const { generate } = require('randomstring')
const { yaml } = require('@toa.io/gears')
const { resolve } = require('path')

const schema = {
  fit: jest.fn((input) => (input.invalid ? { message: generate() } : null))
}

const query = {
  parse: jest.fn(() => ({ [generate()]: generate() }))
}

const declaration = {}

const schemas = {
  request: {
    properties: { query: yaml.sync(resolve(__dirname, '../../src/contract/schemas/query.yaml')) },
    additionalProperties: false
  }
}

exports.schema = schema
exports.query = query
exports.declaration = declaration
exports.schemas = schemas
