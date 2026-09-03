import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { underlay } from '../source/index.js'

describe('segments', () => {
  const instance = underlay((segs) => segs)

  it('should pass segments', () => {
    const result = instance.dummies.a.transit()

    assert.deepStrictEqual(result, ['dummies', 'a', 'transit'])

    const repeat = instance.foo.bar.assign()

    assert.deepStrictEqual(repeat, ['foo', 'bar', 'assign'])
  })

  it('should pass empty array if no segments', () => {
    const segments = instance()
    assert.deepStrictEqual(segments, [])
  })
})

describe('arguments', () => {
  const instance = underlay((segs, args) => ({ segs, args }))

  it('should append arguments', () => {
    const withArgs = instance.foo.bar.baz(1, 'two')

    assert.deepStrictEqual(withArgs, {
      segs: ['foo', 'bar', 'baz'], args: [1, 'two']
    })

    const noArgs = instance.foo()

    assert.deepStrictEqual(noArgs, {
      segs: ['foo'],
      args: []
    })
  })

  it('should append empty array if no arguments passed', () => {
    const { args } = instance()

    assert.deepStrictEqual(args, [])
  })
})

it('should not mix segments between calls', () => {
  const instance = underlay((segs, args) => ({ segs, args }))

  const ref1 = instance.foo.bar
  const ref2 = ref1.baz

  const res1 = ref1.put(1)
  const res2 = ref2.post(2)

  assert.deepStrictEqual(res1.args, [1])
  assert.deepStrictEqual(res1.segs, ['foo', 'bar', 'put'])

  assert.deepStrictEqual(res2.args, [2])
  assert.deepStrictEqual(res2.segs, ['foo', 'bar', 'baz', 'post'])
})
