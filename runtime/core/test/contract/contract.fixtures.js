'use strict'

const { generate } = require('randomstring')
const { load } = require('@toa.io/libraries/yaml')
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
    properties: { query: load.sync(resolve(__dirname, '../../src/contract/schemas/query.yaml')) },
    additionalProperties: false
  }
}

exports.schema = schema
exports.query = query
exports.declaration = declaration
exports.schemas = schemas
