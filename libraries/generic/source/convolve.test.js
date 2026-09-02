import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'
import { generate } from 'randomstring'

import * as fixtures from './.test/convolve.fixtures.js'
import { convolve } from '../source/index.js'

let source

beforeEach(() => {
  source = clone(fixtures.origin)
})

it('should keep original properties', () => {
  source = convolve(source)

  assert.deepStrictEqual(source, fixtures.origin)
})

it('should remove tagged values if no discriminator is given', () => {
  const discriminator = generate()

  source['foo@' + discriminator] = generate()

  source = convolve(source)

  assert.strictEqual(source['foo@' + discriminator], undefined)
  assert.deepStrictEqual(source.foo, fixtures.origin.foo)
})

it('should determine values', () => {
  const discriminator = generate()
  const foo = generate()
  const baz = generate()

  source['foo@' + discriminator] = foo
  source.bar['baz@' + discriminator] = baz

  source = convolve(source, discriminator)

  assert.strictEqual(source['foo@' + discriminator], undefined)
  assert.deepStrictEqual(source.foo, foo)

  assert.strictEqual(source.bar['baz@' + discriminator], undefined)
  assert.deepStrictEqual(source.bar.baz, baz)
})

it('should handle arrays', () => {
  const discriminator = generate()
  const foo = generate()

  source.quu[0] = { ['foo@' + discriminator]: foo }

  source = convolve(source, discriminator)

  assert.deepStrictEqual(source.quu[0].foo, foo)
})

it('should determine nested tagged values', () => {
  const discriminator = generate()
  const baz = generate()

  source['bar@' + discriminator] = {
    ['baz@' + discriminator]: baz,
    ['baz@' + generate()]: generate()
  }

  source = convolve(source, discriminator)

  assert.strictEqual(source['bar@' + discriminator], undefined)
  assert.deepStrictEqual(source.bar.baz, baz)
  assert.deepStrictEqual(Object.keys(source.bar), ['baz'])
})

it('should modify argument', () => {
  const discriminator = generate()

  source['foo@' + discriminator] = generate()

  convolve(source)

  assert.strictEqual(source['foo@' + discriminator], undefined)
  assert.deepStrictEqual(source.foo, fixtures.origin.foo)
})

it('should not affect properties staring with @', () => {
  const value = generate()

  source['@property'] = value

  convolve(source)

  assert.deepStrictEqual(source['@property'], value)
})

it('should not throw on nulls', () => {
  const property = generate()

  source[property] = null

  assert.doesNotThrow(() => convolve(source))
})
