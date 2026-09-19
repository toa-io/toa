import { it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.ts'
import type { Manifest } from '@toa.io/norm'

const component = { namespace: 'chat', name: 'messages' } as Manifest

it('should take routes that say what they expose', () => {
  const declaration = {
    created: { key: ['sender', 'recipient'], expose: ['id', 'text'] },
    updated: { key: 'room', expose: ['id'] }
  }

  assert.deepEqual(manifest(declaration, component), declaration)
})

it('should refuse a route that does not say what it exposes', () => {
  assert.throws(() => manifest({ created: { key: 'room' } }, component), {
    message:
      "Realtime routes of 'chat.messages' are invalid: must have required property 'expose'"
  })
})

it('should refuse a route that is only its key', () => {
  assert.throws(() => manifest({ created: ['sender', 'recipient'] }, component), {
    message: "Realtime routes of 'chat.messages' are invalid: must be object"
  })
})

it('should refuse a route that exposes nothing', () => {
  assert.throws(() => manifest({ created: { key: 'room', expose: [] } }, component), {
    message:
      "Realtime routes of 'chat.messages' are invalid: must NOT have fewer than 1 items"
  })
})
