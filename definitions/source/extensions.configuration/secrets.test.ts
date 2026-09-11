import { it } from 'node:test'
import assert from 'node:assert/strict'

import { assertSecrets } from './secrets.ts'

const schema = {
  type: 'object',
  properties: {
    token: { type: 'string', format: 'secret' },
    name: { type: 'string' },
    keys: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', format: 'secret' }
        }
      }
    }
  }
}

it('should accept a $NAME reference', () => {
  assert.doesNotThrow(() => assertSecrets(schema, { token: '$TOKEN' }))
})

it('should refuse a plain string', () => {
  assert.throws(
    () => assertSecrets(schema, { token: 'plaintext' }),
    (error: Error) =>
      /'token' is a secret and must be given as a \$NAME reference/.test(error.message)
  )
})

it('should refuse a nested plain string', () => {
  assert.throws(
    () => assertSecrets(schema, { keys: [{ key: 'leaked' }] }),
    (error: Error) =>
      /'keys.0.key' is a secret and must be given as a \$NAME reference/.test(
        error.message
      )
  )
})

it('should refuse an environment-tagged plain string', () => {
  assert.throws(
    () => assertSecrets(schema, { 'token@staging': 'plaintext' }),
    (error: Error) =>
      /'token@staging' is a secret and must be given as a \$NAME reference/.test(
        error.message
      )
  )
})

it('should ignore a missing optional secret', () => {
  assert.doesNotThrow(() => assertSecrets(schema, { name: 'ok' }))
})

it('should ignore a string that is not a secret', () => {
  assert.doesNotThrow(() => assertSecrets(schema, { name: 'plaintext' }))
})
