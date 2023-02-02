'use strict'

const { merge, overwrite, add } = require('../src')

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
    .toThrow(new TypeError('generic/merge: conflict at /a/b (\'test\', \'null\')'))

  expect(() => merge({ a: { b: null } }, 1))
    .toThrow(new TypeError('generic/merge: arguments must be of the same type at /'))

  expect(() => merge({ a: { b: 'a' } }, { a: { b: 1 } }))
    .toThrow(new TypeError('generic/merge: conflict at /a/b (\'1\', \'a\')'))
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

  merge(target, undefined)
  expect(target).toStrictEqual({ a: 1 })
})

it('should ignore undefined target', () => {
  const target = { a: undefined }
  const source = { a: 1 }

  merge(target, source)
  expect(target).toStrictEqual({ a: 1 })

  const result = merge(undefined, source)
  expect(result).toStrictEqual({ a: 1 })
})

it('should ignore undefined arguments', () => {
  const result = merge(undefined, undefined)

  expect(result).toStrictEqual({})
})

describe('options', () => {
  describe('ignore', () => {
    const options = { ignore: true }

    it('should ignore conflicts', () => {
      const a = { a: 1, c: [1, 2] }
      const b = { a: 2, b: 1, c: [3, 4] }

      merge(a, b, options)

      expect(a).toStrictEqual({ a: 1, b: 1, c: [1, 2] })
    })
  })

  describe('overwrite', () => {
    const options = { overwrite: true }

    it('should overwrite on conflicts', () => {
      const a = { a: 1, b: 1, d: [1, 2] }
      const b = { a: 2, c: 1, d: [3, 4] }

      merge(a, b, options)

      expect(a).toStrictEqual({ a: 2, b: 1, c: 1, d: [3, 4] })
    })

    it('should overwrite primitive with object', () => {
      const a = { a: 1 }
      const b = { a: { c: 1 } }

      merge(a, b, options)

      expect(a.a).toStrictEqual(b.a)
    })

    it('should overwrite primitive with array', () => {
      const a = { a: 1 }
      const b = { a: [1, 2] }

      merge(a, b, options)

      expect(a.a).toStrictEqual(b.a)
    })
  })
})

describe('overwrite', () => {
  it('should be', async () => {
    expect(overwrite).toBeDefined()
  })

  it('should overwrite properties', async () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const expected = { a: 1, b: 3, c: 4 }

    const output = overwrite(target, source)

    expect(output).toStrictEqual(expected)
    expect(target).toStrictEqual(expected)
  })
})

describe('add', () => {
  it('should be', async () => {
    expect(add).toBeDefined()
  })

  it('should add new properties', async () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const expected = { a: 1, b: 2, c: 4 }

    const output = add(target, source)

    expect(output).toStrictEqual(expected)
    expect(target).toStrictEqual(expected)
  })
})
