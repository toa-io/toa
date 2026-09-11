import { it } from 'node:test'
import assert from 'node:assert/strict'

import { audience, permits } from './Authorization.ts'

const permissions = { '/users/me/**': ['GET'], '/notes/': ['*'] }

it('should permit a matching method and path', () => {
  assert.equal(permits(permissions, 'GET', '/users/me/posts/'), true)
  assert.equal(permits(permissions, 'DELETE', '/notes/'), true)
})

it('should refuse another method or path', () => {
  assert.equal(permits(permissions, 'POST', '/users/me/posts/'), false)
  assert.equal(permits(permissions, 'GET', '/admin/'), false)
})

it('should be matched on the routed path, not on the request URL', () => {
  const raw = '/users/me/%2e%2e/admin/'
  const routed = new URL(raw, 'https://example.com').pathname

  assert.equal(routed, '/users/admin/')
  assert.equal(permits(permissions, 'GET', routed), false)
})

const mcp = new URL('https://nex.toa.io/.mcp')
const pots = new URL('https://nex.toa.io/pots/')

it('should admit an entry the audience names', () => {
  assert.equal(audience(['https://nex.toa.io/.mcp'], mcp), true)
  assert.equal(audience(['/.mcp'], mcp), true)
})

it('should refuse another entry, including the operation a tool would call', () => {
  assert.equal(audience(['https://nex.toa.io/.mcp'], pots), false)
  assert.equal(audience(['/.mcp'], pots), false)
})

it('should admit every path on an origin audience', () => {
  assert.equal(audience(['https://nex.toa.io'], pots), true)
  assert.equal(audience(['https://nex.toa.io/'], mcp), true)
})

it('should refuse an audience for another host', () => {
  assert.equal(audience(['https://evil.example/.mcp'], mcp), false)
})
