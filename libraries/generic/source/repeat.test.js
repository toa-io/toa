'use strict'

const { it, mock } = require('node:test')
const assert = require('node:assert/strict')

const { repeat } = require('../source/repeat')
const { generate } = require('randomstring')
const { random } = require('../source/random')

it('should repeat', () => {
  const fn = mock.fn()

  repeat(fn, 10)

  assert.strictEqual(fn.mock.callCount(), 10)
})

it('should return results', () => {
  const times = random(10)

  
  const fn = mock.fn(() => generate())
  const results = repeat(fn, times)

  fn.mock.calls.map((call, i) => assert.strictEqual(results[i], call.result))
})

it('should return promises', async () => {
  const times = 10

  
  const fn = mock.fn(async () => generate())
  const promise = repeat(fn, times)

  assert.ok(promise instanceof Promise)

  const results = await promise

  for (let i = 0; i < fn.mock.calls.length; i++) {
    assert.strictEqual(results[i], await fn.mock.calls[i].result)
  }
})
