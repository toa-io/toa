'use strict'

const { match } = require('../')

it('should exist', () => {
  expect(match).toBeDefined()
})

it('should match values', () => {
  expect(match(1, 1)).toStrictEqual(true)
  expect(match('foo', 'foo')).toStrictEqual(true)
  expect(match(1, 2)).toStrictEqual(false)
  expect(match(1, '1')).toStrictEqual(false)
})

it('should match arrays', () => {
  expect(match([1, 2], [1, 2])).toStrictEqual(true)
  expect(match([1, 2, 3], [2, 1])).toStrictEqual(true)
  expect(match([1, 2, 3], [2, 1, 4])).toStrictEqual(false)
})

it('should not throw on type mismatch', () => {
  expect(match(1, [1, 2])).toStrictEqual(false)
})

it('should compare objects', () => {
  const reference = {
    foo: 'bar',
    baz: 1,
    qux: {
      arr: [1, 2],
      val: 'text'
    }
  }

  expect(match(reference, { foo: 'bar' })).toStrictEqual(true)
  expect(match(reference, { qux: { val: 'text' } })).toStrictEqual(true)
  expect(match(reference, { qux: { arr: [2] } })).toStrictEqual(true)
})

it('should not throw on nulls', () => {
  expect(match(null, [1, 2])).toStrictEqual(false)
  expect(match(null, { foo: 'bar' })).toStrictEqual(false)
  expect(match([1, 2], null)).toStrictEqual(false)
})
