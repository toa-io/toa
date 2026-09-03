import { it } from 'node:test'
import assert from 'node:assert/strict'

import { redact } from './redact.js'

it('should replace credential values at any depth', () => {
  const input = { input: { username: 'bob', password: 'secret', nested: [{ token: 't' }] }, query: { id: '1' } }

  assert.deepEqual(redact(input), {
    input: { username: 'bob', password: '[redacted]', nested: [{ token: '[redacted]' }] },
    query: { id: '1' }
  })
})

it('should leave an error and its code alone', () => {
  const error = Object.assign(new Error('nope'), { code: 'NOT_FOUND' })

  assert.equal(redact(error), error)
})

it('should not modify the original', () => {
  const input = { password: 'secret' }

  redact(input)

  assert.equal(input.password, 'secret')
})
