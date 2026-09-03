import { it } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { shards } from '../source/index.js'

it('should be', async () => {
  assert.ok(shards instanceof Function)
})

it('should expand shards', async () => {
  const input = 'amqp://host{0-3}.domain.com/?test=1'
  const output = shards(input)

  const expected = [
    'amqp://host0.domain.com/?test=1',
    'amqp://host1.domain.com/?test=1',
    'amqp://host2.domain.com/?test=1',
    'amqp://host3.domain.com/?test=1'
  ]

  assert.deepStrictEqual(output.length, expected.length)
  assert.ok(expected.every((item) => output.some((candidate) => isDeepStrictEqual(candidate, item))))
})

it('should return input if no range specified', async () => {
  const input = 'he{0}llo'
  const output = shards(input)

  assert.deepStrictEqual(output.length, 1)
  assert.deepStrictEqual(output[0], input)
})
