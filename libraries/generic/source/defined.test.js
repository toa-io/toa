'use strict'

const { defined } = require('../')

it('should be', () => {
  expect(defined).toBeDefined()
})

it('should remove undefined', () => {
  const object = { a: 1, b: undefined }

  defined(object)

  expect(object).toStrictEqual({ a: 1 })
})

it('should return result', () => {
  const input = { a: 1, b: undefined }
  const output = defined(input)

  expect(output).toStrictEqual({ a: 1 })
})
