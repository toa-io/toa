'use strict'

const { expand } = require('../src/expand')

it('should be', () => {
  expect(expand).toBeDefined()
})

it('should throw on empty array property value', () => {
  const schema = { foo: [] }

  expect(() => expand(schema)).toThrow('Array property declaration must be non-empty')
})

it('should throw if array property items are not of the same type', () => {
  const schema = { foo: [1, 'ok', []] }

  expect(() => expand(schema)).toThrow('Array property items must be of the same type')
})

it('should not expand valid schema', () => {
  const schema = { type: 'number' }
  const output = expand(schema)

  expect(output).toStrictEqual(schema)
})
