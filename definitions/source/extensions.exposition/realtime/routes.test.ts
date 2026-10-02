import { it } from 'node:test'
import assert from 'node:assert/strict'

import { parse } from './routes.ts'

it('should tell the literals of a route from its properties', () => {
  assert.deepEqual(parse({ created: { key: ['~room', 'sender'], expose: ['id'] } }), [
    { event: 'created', properties: ['sender'], literals: ['~room'], expose: ['id'] }
  ])
})

it('should take a single key as a list of one', () => {
  assert.deepEqual(parse({ created: { key: 'room', expose: ['id'] } }), [
    { event: 'created', properties: ['room'], literals: [], expose: ['id'] }
  ])
})
