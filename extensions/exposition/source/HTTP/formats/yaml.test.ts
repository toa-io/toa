import { encode } from './yaml'

it('encodes error values as their public properties', () => {
  const value = new (class InvalidUsernameError extends Error {
    public readonly code = 'INVALID_USERNAME'
    public override readonly message = 'Username is not meeting the requirements'
  })()

  expect(encode(value).toString())
    .toBe('code: INVALID_USERNAME\nmessage: Username is not meeting the requirements\n')
})

it('writes a value the way its toJSON says', () => {
  const secret = { unwrap: () => 's3cret', toJSON: () => '<REDACTED>' }

  expect(encode({ a: 1, b: secret }).toString()).toBe('a: 1\nb: <REDACTED>\n')
})
