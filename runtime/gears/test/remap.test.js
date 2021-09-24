'use strict'

const { remap } = require('../src/remap')

it('should remap values', () => {
  const object = { a: 1, b: 2 }

  const result = remap(object, (value) => value + 1)

  expect(result).toStrictEqual({ a: 2, b: 3 })
})

it('should return new object', () => {
  const object = { a: 1, b: 2 }

  remap(object, (value) => value + 1)

  expect(object).toStrictEqual({ a: 1, b: 2 })
})

it('should pass key argument', () => {
  const object = { a: 1, b: 2 }

  const result = remap(object, (value, key) => key === 'b' ? value + 1 : value)

  expect(result).toStrictEqual({ a: 1, b: 3 })
})
