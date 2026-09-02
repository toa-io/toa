'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const index = require('../src')

it('should export Factory', () => {
  assert.notStrictEqual(index.Factory, undefined)
})
