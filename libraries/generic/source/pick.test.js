'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { generate } = require('randomstring')

const { pick } = require('../')

it('should be', async () => {
  assert.ok(pick instanceof Function)
})

it('should pick properties', async () => {
  const source = { a: generate(), b: generate() }
  const output = pick(source, ['b'])

  assert.deepStrictEqual(output, { b: source.b })
})
