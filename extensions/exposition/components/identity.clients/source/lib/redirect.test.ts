import { it } from 'node:test'
import assert from 'node:assert/strict'

import { permits } from './redirect.js'

const hosted = ['https://claude.ai/api/mcp/auth_callback']
const native = ['http://localhost/callback', 'http://127.0.0.1/callback']

it('should permit an exact match', () => {
  assert.equal(permits(hosted, 'https://claude.ai/api/mcp/auth_callback'), true)
})

it('should refuse anything else on a registered host', () => {
  assert.equal(permits(hosted, 'https://claude.ai/api/mcp/auth_callback/x'), false)
  assert.equal(permits(hosted, 'https://claude.ai/'), false)
})

it('should refuse a host that merely starts the same way', () => {
  assert.equal(permits(hosted, 'https://claude.ai.evil.example/api/mcp/auth_callback'), false)
})

it('should ignore the port of a loopback address', () => {
  for (const redirect of [
    'http://localhost:3118/callback',
    'http://localhost:51234/callback',
    'http://127.0.0.1:3118/callback'
  ])
    assert.equal(permits(native, redirect), true)
})

it('should not ignore the path of a loopback address', () => {
  assert.equal(permits(native, 'http://localhost:3118/stolen'), false)
})

it('should not treat a remote address as loopback', () => {
  assert.equal(permits(['http://example.com/callback'], 'http://example.com:8080/callback'), false)
})

it('should not cross schemes', () => {
  assert.equal(permits(native, 'https://localhost:3118/callback'), false)
})
