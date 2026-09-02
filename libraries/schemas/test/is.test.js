'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { is } = require('../')

it('should be', async () => {
  assert.notStrictEqual(is, undefined)
})

it('should validate', async () => {
  const ok = { type: 'string' }
  const oh = { type: 'fruit' }

  assert.deepStrictEqual(is(ok), true)
  assert.deepStrictEqual(is(oh), false)
})
