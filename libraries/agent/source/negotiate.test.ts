import { it } from 'node:test'
import assert from 'node:assert/strict'

import { negotiate } from './negotiate.js'

it('should return acceptable', async () => {
  const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp'
  const available = ['application/xml', 'text/html']
  const result = negotiate(accept, available)

  assert.strictEqual(result, 'text/html')
})

it('should return null if not acceptable', async () => {
  const accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp'
  const available = ['application/json']
  const result = negotiate(accept, available)

  assert.strictEqual(result, null)
})
