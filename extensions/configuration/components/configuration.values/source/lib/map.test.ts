import { it, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { VARIABLE, components, entry } from './map.js'

afterEach(() => {
  delete process.env[VARIABLE]
})

it('should be empty without the variable', () => {
  assert.strictEqual(entry('a.b'), undefined)
})

it('should read the variable', () => {
  const values = { 'a.b': { epoch: 'e', schema: { type: 'object' }, defaults: { foo: 1 } } }

  process.env[VARIABLE] = JSON.stringify(values)

  assert.deepStrictEqual(entry('a.b'), values['a.b'])
  assert.strictEqual(entry('a.c'), undefined)
})

it('should follow the variable', () => {
  process.env[VARIABLE] = JSON.stringify({ 'a.b': { epoch: 'e1', schema: {} } })

  assert.deepStrictEqual(entry('a.b')?.epoch, 'e1')

  process.env[VARIABLE] = JSON.stringify({ 'a.b': { epoch: 'e2', schema: {} } })

  assert.deepStrictEqual(entry('a.b')?.epoch, 'e2')
})

it('should list the components by name', () => {
  process.env[VARIABLE] = JSON.stringify({ 'b.two': { epoch: 'e', schema: {} }, 'a.one': { epoch: 'e', schema: {} } })

  assert.deepStrictEqual(components(), ['a.one', 'b.two'])
})
