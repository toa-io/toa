'use strict'

const { generate } = require('randomstring')

const { expand } = require('../src/expand')

it('should be', () => {
  expect(expand).toBeDefined()
})

it('should throw on empty array property value', () => {
  const schema = { foo: [] }

  expect(() => expand(schema)).toThrow('Array property declaration must be non-empty')
})

it('should throw if array property has multiple types', () => {
  const schema = { foo: [1, 'ok', []] }

  expect(() => expand(schema)).toThrow('Array property items must be of the same type')
})

it('should not expand object containing $ref', () => {
  const schema = { $ref: generate() }
  const output = expand(schema)

  expect(output).toStrictEqual(schema)
})
