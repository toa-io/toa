import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { dereference } from '../../src/.component/index.js'
import * as fixtures from './dereference.fixtures.js'

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should dereference', () => {
  dereference(source)

  assert.deepStrictEqual(source, fixtures.target)
})

it('should throw on invalid schema reference', () => {
  source.operations.transit.output.properties.baz = { type: 'string', default: '.' }
  assert.throws(() => dereference(source), (error) => /is not defined/.test(error.message))

  source.operations.transit.output.properties.baz = { type: 'string', default: '.baz' }
  assert.throws(() => dereference(source), (error) => /is not defined/.test(error.message))
})

it('should throw on invalid forwarding', () => {
  source.operations.create.forward = 'foo'
  assert.throws(() => dereference(source), (error) => /is not defined/.test(error.message))
})
