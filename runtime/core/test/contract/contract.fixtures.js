import { mock } from 'node:test'

import { generate } from 'randomstring'
import { readFileSync } from 'node:fs'
import { load as parseYAML } from 'js-yaml'
import { resolve } from 'path'

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
      query: parseYAML(readFileSync(resolve(import.meta.dirname, '../../src/contract/schemas/query.yaml'), 'utf8')),
      authentic: { type: 'boolean' }
    },
    additionalProperties: true
  }
}
