import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Readable } from 'node:stream'
import { generate } from 'randomstring'

import { buffer } from '../source/index.js'

it('should be', async () => {
  assert.ok(buffer instanceof Function)
})

it('should buffer', async () => {
  const input = Buffer.from(generate())
  const stream = Readable.from(input)
  const output = await buffer(stream)

  assert.deepStrictEqual(output, input)
})
