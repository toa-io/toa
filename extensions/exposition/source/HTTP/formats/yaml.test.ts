import { Err } from 'error-value'
import { encode } from './yaml'

it('encodes error values as their public properties', () => {
  const value = new Err('INVALID_USERNAME', 'Username is not meeting the requirements')

  expect(encode(value).toString())
    .toBe('code: INVALID_USERNAME\nmessage: Username is not meeting the requirements\n')
})
