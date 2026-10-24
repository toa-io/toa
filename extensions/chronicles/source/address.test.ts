import { it } from 'node:test'
import assert from 'node:assert/strict'

import { keep } from './address.ts'

it('should keep the /24 of an IPv4 address', () => {
  assert.equal(keep('203.0.113.7', 'truncated'), '203.0.113.0')
})

it('should keep the /48 of an IPv6 address', () => {
  assert.equal(
    keep('2001:db8:85a3:8d3:1319:8a2e:370:7348', 'truncated'),
    '2001:db8:85a3::'
  )
  assert.equal(keep('2001:db8::1', 'truncated'), '2001:db8:0::')
})

it('should keep the whole address where asked', () => {
  assert.equal(keep('2001:db8::1', 'full'), '2001:db8::1')
})

it('should keep nothing of what is not an address', () => {
  assert.equal(keep('not an address', 'full'), null)
  assert.equal(keep(null, 'truncated'), null)
})
