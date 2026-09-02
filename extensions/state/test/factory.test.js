import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { Factory } from '../source/index.js'

it('should be', async () => {
  assert.ok(Factory instanceof Function)
})

/** @type {Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should implement aspect()', async () => {
  assert.ok(factory.aspect instanceof Function)
})
