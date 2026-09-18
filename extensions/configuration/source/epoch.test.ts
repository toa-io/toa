import { it } from 'node:test'
import assert from 'node:assert/strict'

import { epoch, revision } from '@toa.io/definitions/extensions.configuration'

it('should be a sha256 hex', () => {
  assert.match(epoch({ type: 'object' }), /^[a-f0-9]{64}$/)
})

it('should not depend on key order', () => {
  const a = {
    type: 'object',
    properties: { foo: { type: 'string', default: 'x' }, bar: { type: 'number' } }
  }
  const b = {
    properties: { bar: { type: 'number' }, foo: { default: 'x', type: 'string' } },
    type: 'object'
  }

  assert.deepStrictEqual(epoch(a), epoch(b))
})

it('should depend on values', () => {
  const a = { type: 'object', properties: { foo: { type: 'string' } } }
  const b = { type: 'object', properties: { foo: { type: 'number' } } }

  assert.notDeepStrictEqual(epoch(a), epoch(b))
})

it('should keep array order', () => {
  const a = { enum: [1, 2] }
  const b = { enum: [2, 1] }

  assert.notDeepStrictEqual(epoch(a), epoch(b))
})

it('should hash no defaults as the empty object the values service serves', () => {
  assert.equal(revision(undefined), revision({}))
})

it('should give defaults a revision of their own, whatever the key order', () => {
  assert.equal(revision({ foo: 'a', bar: 1 }), revision({ bar: 1, foo: 'a' }))
  assert.notEqual(revision({ foo: 'a' }), revision({ foo: 'b' }))
})
