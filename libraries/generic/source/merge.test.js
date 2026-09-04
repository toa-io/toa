import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { merge, overwrite, add } from '../source/index.js'
import { generate } from 'randomstring'

it('should merge arrays', () => {
  const target = [1, 2]
  const source = [3, 4]

  merge(target, source)

  assert.deepStrictEqual(target, [1, 2, 3, 4])
})

it('should merge properties', () => {
  const target = { a: 1, foo: { a: 1, b: ['foo', 'bar'] } }
  const source = { a: 1, foo: { b: ['baz'], c: 3 }, d: 4 }

  merge(target, source)

  assert.deepStrictEqual(target, { a: 1, foo: { a: 1, b: ['foo', 'bar', 'baz'], c: 3 }, d: 4 })
})

it('should return target', () => {
  const target = { a: 1, foo: { a: 1, b: ['foo', 'bar'] } }
  const source = { a: 1, foo: { b: ['baz'], c: 3 }, d: 4 }

  const result = merge(target, source)

  assert.strictEqual(result, target)
})

it('should throw TypeError on non-objects', () => {
  assert.throws(() => merge(1, 2), TypeError)
  assert.throws(() => merge({}, 2), TypeError)

  assert.throws(() => merge({ a: { b: null } }, { a: { b: 'test' } }))

  assert.throws(() => merge({ a: { b: null } }, 1))

  assert.throws(() => merge({ a: { b: 'a' } }, { a: { b: 1 } }))
})

it('should throw on conflict', () => {
  assert.throws(() => merge({ a: 1 }, { a: 2 }), (error) => /conflict/.test(error.message))
})

it('should throw with conflict path', () => {
  assert.throws(() => merge({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }), (error) => /\/a\/b\/c/.test(error.message))
})

it('should ignore undefined source', () => {
  const target = { a: 1 }
  const source = { a: undefined }

  merge(target, source)
  assert.deepStrictEqual(target, { a: 1 })

  merge(target, undefined)
  assert.deepStrictEqual(target, { a: 1 })
})

it('should ignore undefined target', () => {
  const target = { a: undefined }
  const source = { a: 1 }

  merge(target, source)
  assert.deepStrictEqual(target, { a: 1 })

  const result = merge(undefined, source)
  assert.deepStrictEqual(result, { a: 1 })
})

it('should ignore undefined arguments', () => {
  const result = merge(undefined, undefined)

  assert.deepStrictEqual(result, {})
})

it('should merge symbol properties', async () => {
  const sym = Symbol('test')
  const value = generate()
  const source = { [sym]: value }
  const target = {}

  merge(target, source)

  assert.deepStrictEqual(target, source)
})

describe('options', () => {
  describe('ignore', () => {
    const options = { ignore: true }

    it('should ignore conflicts', () => {
      const a = { a: 1, c: [1, 2] }
      const b = { a: 2, b: 1, c: [3, 4] }

      merge(a, b, options)

      assert.deepStrictEqual(a, { a: 1, b: 1, c: [1, 2] })
    })
  })

  describe('overwrite', () => {
    const options = { overwrite: true }

    it('should overwrite on conflicts', () => {
      const a = { a: 1, b: 1, d: [1, 2] }
      const b = { a: 2, c: 1, d: [3, 4] }

      merge(a, b, options)

      assert.deepStrictEqual(a, { a: 2, b: 1, c: 1, d: [3, 4] })
    })

    it('should overwrite primitive with object', () => {
      const a = { a: 1 }
      const b = { a: { c: 1 } }

      merge(a, b, options)

      assert.deepStrictEqual(a.a, b.a)
    })

    it('should overwrite primitive with array', () => {
      const a = { a: 1 }
      const b = { a: [1, 2] }

      merge(a, b, options)

      assert.deepStrictEqual(a.a, b.a)
    })
  })
})

describe('overwrite', () => {
  it('should be', async () => {
    assert.notStrictEqual(overwrite, undefined)
  })

  it('should overwrite properties', async () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const expected = { a: 1, b: 3, c: 4 }

    const output = overwrite(target, source)

    assert.deepStrictEqual(output, expected)
    assert.deepStrictEqual(target, expected)
  })
})

describe('add', () => {
  it('should be', async () => {
    assert.notStrictEqual(add, undefined)
  })

  it('should add new properties', async () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const expected = { a: 1, b: 2, c: 4 }

    const output = add(target, source)

    assert.deepStrictEqual(output, expected)
    assert.deepStrictEqual(target, expected)
  })
})

it('should not repeat what both arrays hold', () => {
  const target = ['id', 'title']
  const source = ['id']

  merge(target, source)

  assert.deepStrictEqual(target, ['id', 'title'])
})

it('should keep objects that only look alike', () => {
  const target = [{ a: 1 }]
  const source = [{ a: 1 }]

  merge(target, source)

  assert.deepStrictEqual(target, [{ a: 1 }, { a: 1 }])
})

it('should not repeat what a nested array holds', () => {
  const target = { entity: { required: ['id', 'title'] } }
  const source = { entity: { required: ['id'] } }

  merge(target, source)

  assert.deepStrictEqual(target, { entity: { required: ['id', 'title'] } })
})
