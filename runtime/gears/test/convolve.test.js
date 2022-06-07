'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./convolve.fixtures')
const { convolve } = require('../src')

let source

beforeEach(() => {
  source = clone(fixtures.origin)
})

it('should keep original properties', () => {
  source = convolve(source)

  expect(source).toStrictEqual(fixtures.origin)
})

it('should remove tagged values if no dimension is given', () => {
  const dimension = generate()
  source['foo@' + dimension] = generate()

  source = convolve(source)

  expect(source['foo@' + dimension]).toBeUndefined()
  expect(source.foo).toStrictEqual(fixtures.origin.foo)
})

it('should determine values', () => {
  const dimension = generate()
  const foo = generate()
  const baz = generate()

  source['foo@' + dimension] = foo
  source.bar['baz@' + dimension] = baz

  source = convolve(source, dimension)

  expect(source['foo@' + dimension]).toBeUndefined()
  expect(source.foo).toStrictEqual(foo)

  expect(source.bar['baz@' + dimension]).toBeUndefined()
  expect(source.bar.baz).toStrictEqual(baz)
})

it('should handle arrays', () => {
  const dimension = generate()
  const foo = generate()

  source.quu[0] = { ['foo@' + dimension]: foo }

  source = convolve(source, dimension)

  expect(source.quu[0].foo).toStrictEqual(foo)
})

it('should determine nested tagged values', () => {
  const dimension = generate()
  const baz = generate()

  source['bar@' + dimension] = { ['baz@' + dimension]: baz, ['baz@' + generate()]: generate() }

  source = convolve(source, dimension)

  expect(source['bar@' + dimension]).toBeUndefined()
  expect(source.bar.baz).toStrictEqual(baz)
  expect(Object.keys(source.bar)).toStrictEqual(['baz'])
})

it('should modify argument', () => {
  const dimension = generate()
  source['foo@' + dimension] = generate()

  convolve(source)

  expect(source['foo@' + dimension]).toBeUndefined()
  expect(source.foo).toStrictEqual(fixtures.origin.foo)
})
