'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { concat } = require('../source/concat')

it('should concat strings', () => {
  assert.strictEqual(concat('/', 'ref'), '/ref')
})

it('should return empty string if one of arguments is undefined', () => {
  assert.strictEqual(concat(undefined, '.'), '')
})
