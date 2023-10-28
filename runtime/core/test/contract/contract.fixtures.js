'use strict'

const { generate } = require('randomstring')
const { load } = require('@toa.io/yaml')
const { resolve } = require('path')

// noinspection JSCheckFunctionSignatures
const schema = {
  fit: jest.fn((input) => (input.invalid ? { message: generate() } : null))
}

const query = {
  parse: jest.fn(() => ({ [generate()]: generate() }))
}

const declaration = {}

const schemas = {
  request: {
    type: 'object',
    properties: {
      input: { type: 'null' },
      query: load.sync(resolve(__dirname, '../../src/contract/schemas/query.yaml')),
      authentic: { type: 'boolean' }
    },
    additionalProperties: true
  }
}

exports.schema = schema
exports.query = query
exports.declaration = declaration
exports.schemas = schemas
