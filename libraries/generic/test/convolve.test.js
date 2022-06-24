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

it('should remove tagged values if no discriminator is given', () => {
  const discriminator = generate()

  source['foo@' + discriminator] = generate()

  source = convolve(source)

  expect(source['foo@' + discriminator]).toBeUndefined()
  expect(source.foo).toStrictEqual(fixtures.origin.foo)
})

it('should determine values', () => {
  const discriminator = generate()
  const foo = generate()
  const baz = generate()

  source['foo@' + discriminator] = foo
  source.bar['baz@' + discriminator] = baz

  source = convolve(source, discriminator)

  expect(source['foo@' + discriminator]).toBeUndefined()
  expect(source.foo).toStrictEqual(foo)

  expect(source.bar['baz@' + discriminator]).toBeUndefined()
  expect(source.bar.baz).toStrictEqual(baz)
})

it('should handle arrays', () => {
  const discriminator = generate()
  const foo = generate()

  source.quu[0] = { ['foo@' + discriminator]: foo }

  source = convolve(source, discriminator)

  expect(source.quu[0].foo).toStrictEqual(foo)
})

it('should determine nested tagged values', () => {
  const discriminator = generate()
  const baz = generate()

  source['bar@' + discriminator] = { ['baz@' + discriminator]: baz, ['baz@' + generate()]: generate() }

  source = convolve(source, discriminator)

  expect(source['bar@' + discriminator]).toBeUndefined()
  expect(source.bar.baz).toStrictEqual(baz)
  expect(Object.keys(source.bar)).toStrictEqual(['baz'])
})

it('should modify argument', () => {
  const discriminator = generate()

  source['foo@' + discriminator] = generate()

  convolve(source)

  expect(source['foo@' + discriminator]).toBeUndefined()
  expect(source.foo).toStrictEqual(fixtures.origin.foo)
})

it('should not affect properties staring with @', () => {
  const value = generate()

  source['@property'] = value

  convolve(source)

  expect(source['@property']).toStrictEqual(value)
})

it('should not throw on nulls', () => {
  const property = generate()

  source[property] = null

  expect(() => convolve(source)).not.toThrow()
})
