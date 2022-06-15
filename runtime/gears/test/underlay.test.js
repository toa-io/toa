'use strict'

const { underlay } = require('../src')

describe('segments', () => {
  const instance = underlay((segs) => segs)

  it('should pass segments', () => {
    const result = instance.dummies.a.transit()
    expect(result).toStrictEqual(['dummies', 'a', 'transit'])

    const repeat = instance.foo.bar.assign()
    expect(repeat).toStrictEqual(['foo', 'bar', 'assign'])
  })

  it('should pass empty array if no segments', () => {
    const segments = instance()
    expect(segments).toStrictEqual([])
  })
})

describe('arguments', () => {
  const instance = underlay((segs, args) => ({ segs, args }))

  it('should append arguments', () => {
    const withArgs = instance.foo.bar.baz(1, 'two')

    expect(withArgs).toStrictEqual({
      segs: ['foo', 'bar', 'baz'], args: [1, 'two']
    })

    const noArgs = instance.foo()

    expect(noArgs).toStrictEqual({
      segs: ['foo'],
      args: []
    })
  })

  it('should append empty array if no arguments passed', () => {
    const { args } = instance()

    expect(args).toStrictEqual([])
  })
})

it('should not mix segments between calls', () => {
  const instance = underlay((segs, args) => ({ segs, args }))

  const ref1 = instance.foo.bar
  const ref2 = ref1.baz

  const res1 = ref1.put(1)
  const res2 = ref2.post(2)

  expect(res1.args).toStrictEqual([1])
  expect(res1.segs).toStrictEqual(['foo', 'bar', 'put'])

  expect(res2.args).toStrictEqual([2])
  expect(res2.segs).toStrictEqual(['foo', 'bar', 'baz', 'post'])
})
