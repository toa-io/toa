import { mock } from 'node:test'

import { generate } from 'randomstring'

import { query as querySchema } from '../../source/contract/schemas.js'

// noinspection JSCheckFunctionSignatures
export const schema = {
  fit: mock.fn((input) => (input.invalid ? { message: generate() } : null))
}

export const query = {
  parse: mock.fn(() => ({ [generate()]: generate() }))
}

export const declaration = {}

export const schemas = {
  request: {
    type: 'object',
    properties: {
      input: { type: 'null' },
      query: querySchema,
      authentic: { type: 'boolean' }
    },
    additionalProperties: true
  }
}
