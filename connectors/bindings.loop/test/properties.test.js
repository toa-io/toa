'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { properties } = require('../')

it('should export properties', async () => {
  assert.deepStrictEqual(properties, { async: false, local: true })
})
