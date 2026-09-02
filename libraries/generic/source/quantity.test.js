'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { quantity } = require('../')

it('should be', async () => {
  assert.notStrictEqual(quantity, undefined)
})

it('should decode k', async () => {
  const value = quantity('10kB')

  assert.deepStrictEqual(value, 10000)
})

it('should decode K', async () => {
  const value = quantity('2KB')

  assert.deepStrictEqual(value, 2048)
})

it('should decode Mi', async () => {
  const value = quantity('3MiB')

  assert.deepStrictEqual(value, 3 * 1024 * 1024)
})

it('should decode Ti', async () => {
  const value = quantity('3TiB')

  assert.deepStrictEqual(value, 3 * 1024 * 1024 * 1024 * 1024)
})

it('should decode float', async () => {
  const value = quantity('0.5MB')

  assert.deepStrictEqual(value, 0.5 * 1000 * 1000)
})

it('should decode plain number', async () => {
  const value = quantity('0.5')

  assert.deepStrictEqual(value, 0.5)
})

it('should throw if not quantity', async () => {
  assert.throws(() => quantity('KB10'), (error) => /'KB10' doesn't look like a quantity of something/.test(error.message))
})

it('should throw if multiplier not known', async () => {
  assert.throws(() => quantity('10wB'), (error) => /'wB' doesn't look like a quantity unit/.test(error.message))
})
