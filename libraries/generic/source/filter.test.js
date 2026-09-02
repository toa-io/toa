import { it } from 'node:test'
import assert from 'node:assert/strict'

import { filter } from '../source/index.js'
import { immediate } from './immediate.js'

it('should be', async () => {
  assert.ok(filter instanceof Function)
})

it('should filter', async () => {
  async function test (value) {
    await immediate()
    return value === 'b'
  }

  const array = ['a', 'b']
  const output = await filter(array, test)

  assert.deepStrictEqual(output, ['b'])
})
