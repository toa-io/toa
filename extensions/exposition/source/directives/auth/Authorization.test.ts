import { it } from 'node:test'
import assert from 'node:assert/strict'

import { permits } from './Authorization.js'

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
