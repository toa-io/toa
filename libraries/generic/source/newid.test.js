'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { newid } = require('../source')

it('should return id', () => {
  const id = newid()

  assert.strictEqual(typeof id, 'string')
  assert.strictEqual(id.length, 32)
})
