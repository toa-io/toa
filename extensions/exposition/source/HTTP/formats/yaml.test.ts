import { it } from 'node:test'
import assert from 'node:assert/strict'

import { encode } from './yaml.js'

it('encodes error values as their public properties', () => {
  const value = new (class InvalidUsernameError extends Error {
    public readonly code = 'INVALID_USERNAME'
    public override readonly message = 'Username is not meeting the requirements'
  })()

  assert.strictEqual(encode(value).toString(), 'code: INVALID_USERNAME\nmessage: Username is not meeting the requirements\n')
})

it('writes a value the way its toJSON says', () => {
  const secret = { unwrap: () => 's3cret', toJSON: () => '<REDACTED>' }

  assert.strictEqual(encode({ a: 1, b: secret }).toString(), 'a: 1\nb: <REDACTED>\n')
})
