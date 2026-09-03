import { it } from 'node:test'
import assert from 'node:assert/strict'

import { inspect } from 'node:util'
import { REDACTED, Secret } from './Secret.js'

const secret = new Secret('s3cret')

it('should unwrap', () => {
  assert.deepStrictEqual(secret.unwrap(), 's3cret')
})

it('should not show as a string', () => {
  assert.deepStrictEqual(String(secret), REDACTED)
  assert.deepStrictEqual(`${secret}`, REDACTED)
  assert.deepStrictEqual('' + secret, REDACTED)
})

it('should not show in JSON', () => {
  assert.deepStrictEqual(JSON.stringify({ key: secret }), '{"key":"<REDACTED>"}')
})

it('should not show when inspected', () => {
  assert.deepStrictEqual(inspect(secret), REDACTED)
  assert.ok(inspect({ key: secret }).includes(REDACTED))
  assert.ok(!(inspect({ key: secret }).includes('s3cret')))
})

it('should not expose the value as a property', () => {
  assert.deepStrictEqual(Object.keys(secret), [])
  assert.deepStrictEqual({ ...secret }, {})
})
