'use strict'

const { underlay } = require('../src')

it('should underlay', () => {
  const instance = underlay((domain, name, endpoint) => ({ domain, name, endpoint }))

  const result = instance.dummies.a.transit()

  expect(result).toStrictEqual({
    domain: 'dummies',
    name: 'a',
    endpoint: 'transit'
  })

  const repeat = instance.foo.bar.assign()

  expect(repeat).toStrictEqual({
    domain: 'foo',
    name: 'bar',
    endpoint: 'assign'
  })
})

it('should underlay async', async () => {
  /** @type {toa.gears.Underlay} */
  const instance = underlay(async (domain, name, endpoint, input, query) =>
    ({ domain, name, endpoint, input, query }))

  const result = await instance.dummies.a.transit('ok', { ok: 1 })

  expect(result).toStrictEqual({
    domain: 'dummies',
    name: 'a',
    endpoint: 'transit',
    input: 'ok',
    query: { ok: 1 }
  })
})

it('should append arguments', () => {
  const instance = underlay((a, b, c) => ({ a, b, c }))

  const r1 = instance('a', 'b', 'c')

  expect(r1).toStrictEqual({
    a: 'a',
    b: 'b',
    c: 'c'
  })

  const r2 = instance.foo('bar', 'baz')

  expect(r2).toStrictEqual({
    a: 'foo',
    b: 'bar',
    c: 'baz'
  })
})

it('should throw on arguments length mismatch', () => {
  const instance = underlay((a, b, c) => ({ a, b, c }))

  expect(() => instance.a('b')).toThrow(/3 expected, 2 given/)
  expect(() => instance.a.b.c('d')).toThrow(/3 expected, 4 given/)
})

it('should not throw on arguments.length = 0', () => {
  const instance = underlay((...args) => args)

  const r1 = instance('a', 'b')

  expect(r1).toStrictEqual(['a', 'b'])
})
