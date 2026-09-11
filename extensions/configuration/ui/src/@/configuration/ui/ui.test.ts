import { it, expect } from 'vitest'
import { matches, rank, split } from './ui'

it('should split a namespaced name', () => {
  expect(split('identity.tokens')).toEqual({ namespace: 'identity', component: 'tokens' })
})

it('should read an unqualified name as the default namespace', () => {
  expect(split('dummy')).toEqual({ namespace: 'default', component: 'dummy' })
})

it('should split on the first dot only', () => {
  expect(split('a.b.c')).toEqual({ namespace: 'a', component: 'b.c' })
})

it('should match a subsequence', () => {
  expect(matches('identity.tokens', 'idtok')).toBe(true)
  expect(matches('identity.tokens', 'identity tokens')).toBe(true)
  expect(matches('identity.tokens', '')).toBe(true)
  expect(matches('identity.tokens', 'zzz')).toBe(false)
})

const dummy = {
  component: 'dummies.dummy',
  configuration: {
    foo: 'deployed',
    num: 7,
    nested: { deep: { flag: true } },
    greetings: [{ text: 'hello' }],
    apiKey: '$STRIPE_API_KEY',
  },
}

it('should rank a name above what a configuration holds', () => {
  expect(rank(dummy, 'dummy')).toBeGreaterThan(rank(dummy, 'deployed'))
})

it('should match a top-level key and value', () => {
  expect(rank(dummy, 'foo')).toBe(1)
  expect(rank(dummy, 'deployed')).toBe(1)
})

it('should match a nested key and value', () => {
  expect(rank(dummy, 'deep')).toBe(1)
  expect(rank(dummy, 'flag')).toBe(1)
})

it('should match inside a list of objects', () => {
  expect(rank(dummy, 'hello')).toBe(1)
  expect(rank(dummy, 'text')).toBe(1)
})

it('should match a number or a boolean', () => {
  expect(rank(dummy, '7')).toBe(1)
  expect(rank(dummy, 'true')).toBe(1)
})

it('should match the key of a secret but never its reference', () => {
  expect(rank(dummy, 'apiKey')).toBe(1)
  expect(rank(dummy, 'STRIPE')).toBe(0)
})

it('should not match across two unrelated values', () => {
  expect(rank(dummy, 'deployedhello')).toBe(0)
})

it('should keep every component on an empty query', () => {
  expect(rank(dummy, '')).toBe(2)
})
