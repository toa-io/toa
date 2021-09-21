'use strict'

const { empty } = require('../src/empty')

it('should return true', () => {
  expect(empty({})).toBe(true)
})

it('should return false', () => {
  expect(empty({ a: 1 })).toBe(false)
})

it('should affect by non-enumerable properties', () => {
  const o = {}

  Object.defineProperty(o, 'a', { value: 1, enumerable: false })

  expect(empty(o)).toBe(true)
})
