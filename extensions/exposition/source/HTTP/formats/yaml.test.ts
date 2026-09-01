import { encode } from './yaml'

it('encodes error values as their public properties', () => {
  const value = new (class InvalidUsernameError extends Error {
    public readonly code = 'INVALID_USERNAME'
    public override readonly message = 'Username is not meeting the requirements'
  })()

  expect(encode(value).toString())
    .toBe('code: INVALID_USERNAME\nmessage: Username is not meeting the requirements\n')
})
