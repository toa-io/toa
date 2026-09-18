import { it } from 'node:test'
import assert from 'node:assert/strict'

import { parse } from './deployment.ts'

it('should parse a static route', () => {
  assert.deepEqual(parse({ 'default.messages.created': ['sender', 'recipient'] }), [
    { event: 'default.messages.created', properties: ['sender', 'recipient'] }
  ])
})

it('should parse a dynamic route with no key', () => {
  assert.deepEqual(parse({ 'default.messages.created': { dynamic: true } }), [
    { event: 'default.messages.created', properties: [], expose: undefined, dynamic: {} }
  ])
})

it('should parse what a dynamic route may expose', () => {
  const [route] = parse({
    'default.messages.created': { key: 'recipient', dynamic: { expose: ['text'] } }
  })

  assert.deepEqual(route.properties, ['recipient'])
  assert.deepEqual(route.dynamic, { expose: ['text'] })
})

it('should not declare an event dynamic with `dynamic: false`', () => {
  const [route] = parse({
    'default.messages.created': { key: 'recipient', dynamic: false }
  })

  assert.equal(route.dynamic, undefined)
})
