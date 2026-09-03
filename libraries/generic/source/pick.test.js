import { it } from 'node:test'
import assert from 'node:assert/strict'

import { generate } from 'randomstring'

import { pick } from '../source/index.js'

it('should be', async () => {
  assert.ok(pick instanceof Function)
})

it('should pick properties', async () => {
  const source = { a: generate(), b: generate() }
  const output = pick(source, ['b'])

  assert.deepStrictEqual(output, { b: source.b })
})
