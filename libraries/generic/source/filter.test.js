'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { filter } = require('../')
const { immediate } = require('./immediate')

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
