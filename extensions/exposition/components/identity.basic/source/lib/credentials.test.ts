import { it } from 'node:test'
import assert from 'node:assert/strict'

import { split } from './credentials.js'

const encode = (value: string): string => Buffer.from(value).toString('base64')

it('should split at the first colon', () => {
  assert.deepEqual(split(encode('user:pa:ss:word')), ['user', 'pa:ss:word'])
})

it('should accept an empty password', () => {
  assert.deepEqual(split(encode('user:')), ['user', ''])
})

it('should refuse credentials without a colon', () => {
  assert.equal(split(encode('user')), null)
})
