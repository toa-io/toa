import { inspect } from 'node:util'
import { REDACTED, Secret } from './Secret'

const secret = new Secret('s3cret')

it('should unwrap', () => {
  expect(secret.unwrap()).toStrictEqual('s3cret')
})

it('should not show as a string', () => {
  expect(String(secret)).toStrictEqual(REDACTED)
  expect(`${secret}`).toStrictEqual(REDACTED)
  expect('' + secret).toStrictEqual(REDACTED)
})

it('should not show in JSON', () => {
  expect(JSON.stringify({ key: secret })).toStrictEqual('{"key":"<REDACTED>"}')
})

it('should not show when inspected', () => {
  expect(inspect(secret)).toStrictEqual(REDACTED)
  expect(inspect({ key: secret })).toContain(REDACTED)
  expect(inspect({ key: secret })).not.toContain('s3cret')
})

it('should not expose the value as a property', () => {
  expect(Object.keys(secret)).toStrictEqual([])
  expect({ ...secret }).toStrictEqual({})
})
