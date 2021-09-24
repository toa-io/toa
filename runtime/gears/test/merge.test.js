'use strict'

const { merge } = require('../src/merge')

it('should merge arrays', () => {
  const target = [1, 2]
  const source = [3, 4]

  merge(target, source)

  expect(target).toStrictEqual([1, 2, 3, 4])
})

it('should merge properties', () => {
  const target = { a: 1, foo: { a: 1, b: ['foo', 'bar'] } }
  const source = { a: 1, foo: { b: ['baz'], c: 3 }, d: 4 }

  merge(target, source)

  expect(target).toStrictEqual({ a: 1, foo: { a: 1, b: ['foo', 'bar', 'baz'], c: 3 }, d: 4 })
})

it('should return target', () => {
  const target = { a: 1, foo: { a: 1, b: ['foo', 'bar'] } }
  const source = { a: 1, foo: { b: ['baz'], c: 3 }, d: 4 }

  const result = merge(target, source)

  expect(result).toBe(target)
})

it('should throw TypeError on non-objects', () => {
  expect(() => merge(1, 2)).toThrow(TypeError)
  expect(() => merge({}, 2)).toThrow(TypeError)

  expect(() => merge({ a: { b: null } }, { a: { b: 'test' } }))
    .toThrow(new TypeError('gears/merge: conflict at /a/b'))

  expect(() => merge({ a: { b: null } }, 1))
    .toThrow(new TypeError('gears/merge: arguments must be object type at /'))

  expect(() => merge({ a: { b: 'a' } }, { a: { b: 1 } }))
    .toThrow(new TypeError('gears/merge: conflict at /a/b'))
})

it('should throw on conflict', () => {
  expect(() => merge({ a: 1 }, { a: 2 })).toThrow(/conflict/)
})

it('should throw with conflict path', () => {
  expect(() => merge({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }))
    .toThrow(/\/a\/b\/c/)
})

it('should ignore undefined source', () => {
  const target = { a: 1 }
  const source = { a: undefined }

  merge(target, source)

  expect(target).toStrictEqual({ a: 1 })
})
