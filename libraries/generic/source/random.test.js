import { it } from 'node:test'
import assert from 'node:assert/strict'

import { random } from '../source/random.js'

it('should be less than or equal to ceil(max)', () => {
  const iterations = 100

  
  for (let i = iterations; i > 0; i--) {
    const max = Math.ceil(Math.random() * i)
    const value = random(max)

    assert.ok(value <= max)
  }
})

it('should be integer', () => {
  const value = random(10)

  assert.strictEqual(value % 1, 0)
})

it('should be less than 100 by default', () => {
  const iterations = 100

  
  for (let i = iterations; i > 0; i--) {
    const value = random()

    assert.ok(value <= 100)
  }
})
