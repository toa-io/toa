'use strict'

const { codes, schema } = require('../../src/io/error')

it('should export codes', () => {
  expect(codes.INTERNAL).toBe(0)
  expect(codes.resolve(codes.INTERNAL)).toBe('INTERNAL')
})

it('should export schema', () => {
  expect(schema.$id).toBe('http://schemas.kookaburra.dev/runtime/io/error.schema.json')
})
