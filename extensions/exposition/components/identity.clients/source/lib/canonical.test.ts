import { it } from 'node:test'
import assert from 'node:assert/strict'

import { identify } from './canonical.js'
import type { Metadata } from './Entity.js'

const metadata: Metadata = {
  client_name: 'Claude',
  redirect_uris: ['https://claude.ai/api/mcp/auth_callback', 'http://localhost/callback']
}

it('should be the id the entity accepts', () => {
  assert.match(identify('nex', metadata), /^[a-f0-9]{32}$/)
})

it('should give the same client the same id, however many times it registers', () => {
  assert.equal(identify('nex', metadata), identify('nex', { ...metadata }))
})

it('should not depend on the order the redirects were written in', () => {
  const reordered = { ...metadata, redirect_uris: [...metadata.redirect_uris].reverse() }

  assert.equal(identify('nex', metadata), identify('nex', reordered))
})

it('should not depend on what is not honoured', () => {
  const noisy = { ...metadata, token_endpoint_auth_method: 'none' } as Metadata

  assert.equal(identify('nex', metadata), identify('nex', noisy))
})

it('should separate authorities, which credentials are scoped to', () => {
  assert.notEqual(identify('nex', metadata), identify('other', metadata))
})

it('should separate what differs', () => {
  for (const changed of [
    { ...metadata, client_name: 'Not Claude' },
    { ...metadata, redirect_uris: ['https://claude.ai/api/mcp/auth_callback'] },
    { ...metadata, scope: 'app:notes' }
  ])
    assert.notEqual(identify('nex', metadata), identify('nex', changed))
})
