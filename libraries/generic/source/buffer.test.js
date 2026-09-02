'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { Readable } = require('node:stream')
const { generate } = require('randomstring')

const { buffer } = require('../')

it('should be', async () => {
  assert.ok(buffer instanceof Function)
})

it('should buffer', async () => {
  const input = Buffer.from(generate())
  const stream = Readable.from(input)
  const output = await buffer(stream)

  assert.deepStrictEqual(output, input)
})
