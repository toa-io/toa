'use strict'

const { generate } = require('randomstring')
const { readFileSync } = require('node:fs')
const { load: parseYAML } = require('js-yaml')
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
      query: parseYAML(readFileSync(resolve(__dirname, '../../src/contract/schemas/query.yaml'), 'utf8')),
      authentic: { type: 'boolean' }
    },
    additionalProperties: true
  }
}

exports.schema = schema
exports.query = query
exports.declaration = declaration
exports.schemas = schemas
