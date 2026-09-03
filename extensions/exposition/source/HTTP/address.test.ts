import { it } from 'node:test'
import assert from 'node:assert/strict'

import { address } from './address.js'
import type { IncomingMessage } from './types.js'

const request = (headers: Record<string, string>): IncomingMessage =>
  ({ headers, socket: { remoteAddress: '9.9.9.9' } }) as unknown as IncomingMessage

it('should be nothing without a header named', () => {
  assert.equal(address(request({ 'x-forwarded-for': '1.1.1.1' })), undefined)
})

it('should be the last value of the named header', () => {
  assert.equal(address(request({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }), 'x-forwarded-for'), '2.2.2.2')
  assert.equal(address(request({ 'cf-connecting-ip': '3.3.3.3' }), 'cf-connecting-ip'), '3.3.3.3')
})

it('should be nothing when the named header is absent or empty', () => {
  assert.equal(address(request({}), 'x-real-ip'), undefined)
  assert.equal(address(request({ 'x-real-ip': ' ' }), 'x-real-ip'), undefined)
})
