import { epoch } from './epoch.js'

it('should be a sha256 hex', () => {
  expect(epoch({ type: 'object' })).toMatch(/^[a-f0-9]{64}$/)
})

it('should not depend on key order', () => {
  const a = { type: 'object', properties: { foo: { type: 'string', default: 'x' }, bar: { type: 'number' } } }
  const b = { properties: { bar: { type: 'number' }, foo: { default: 'x', type: 'string' } }, type: 'object' }

  expect(epoch(a)).toStrictEqual(epoch(b))
})

it('should depend on values', () => {
  const a = { type: 'object', properties: { foo: { type: 'string' } } }
  const b = { type: 'object', properties: { foo: { type: 'number' } } }

  expect(epoch(a)).not.toStrictEqual(epoch(b))
})

it('should keep array order', () => {
  const a = { enum: [1, 2] }
  const b = { enum: [2, 1] }

  expect(epoch(a)).not.toStrictEqual(epoch(b))
})
