'use strict'

const { seal } = require('../source/seal')

it('should seal', () => {
  const object = { foo: 'bar' }

  seal(object)

  expect(() => (object.bar = 'foo')).toThrow(/not extensible/)
})

it('should deep seal', () => {
  const object = { foo: { bar: 'baz ' } }

  seal(object)

  expect(() => (object.foo.baz = 'foo')).toThrow(/not extensible/)
})

it('should not throw on null or undefined', () => {
  expect(() => seal(null)).not.toThrow()
  expect(() => seal(undefined)).not.toThrow()
})

it('should return frozen object', () => {
  const object = { foo: 'bar' }
  const result = seal(object)

  expect(result).toBe(object)
})
