import { it, expect } from 'vitest'
import { holds, read } from './read'

it('should read scalars', () => {
  expect(read({ foo: 'hello', num: 0, on: true, none: null })).toEqual([
    { depth: 0, key: 'foo', value: 'hello', secret: false },
    { depth: 0, key: 'num', value: '0', secret: false },
    { depth: 0, key: 'on', value: 'true', secret: false },
    { depth: 0, key: 'none', value: 'null', secret: false },
  ])
})

it('should open an object onto its properties', () => {
  expect(read({ nested: { foo: 'bar' } })).toEqual([
    { depth: 0, key: 'nested', value: null, secret: false },
    { depth: 1, key: 'foo', value: 'bar', secret: false },
  ])
})

it('should mark a list item', () => {
  expect(read({ list: ['one', 'two'] })).toEqual([
    { depth: 0, key: 'list', value: null, secret: false },
    { depth: 1, key: '-', value: 'one', secret: false },
    { depth: 1, key: '-', value: 'two', secret: false },
  ])
})

it('should open a list of objects', () => {
  expect(read({ greetings: [{ text: 'hello', times: 2 }] })).toEqual([
    { depth: 0, key: 'greetings', value: null, secret: false },
    { depth: 1, key: '-', value: null, secret: false },
    { depth: 2, key: 'text', value: 'hello', secret: false },
    { depth: 2, key: 'times', value: '2', secret: false },
  ])
})

it('should write an empty object or list rather than open it', () => {
  expect(read({ nothing: {}, none: [] })).toEqual([
    { depth: 0, key: 'nothing', value: '{}', secret: false },
    { depth: 0, key: 'none', value: '[]', secret: false },
  ])
})

it('should never show a secret', () => {
  expect(read({ apiKey: '$STRIPE_API_KEY' })).toEqual([
    { depth: 0, key: 'apiKey', value: null, secret: true },
  ])
})

it('should read a secret nested in a list', () => {
  expect(read({ keys: [{ key: '$KEY0' }] })).toEqual([
    { depth: 0, key: 'keys', value: null, secret: false },
    { depth: 1, key: '-', value: null, secret: false },
    { depth: 2, key: 'key', value: null, secret: true },
  ])
})

it('should take a reference of digits, as the runtime does', () => {
  expect(read({ price: '$100' })).toEqual([{ depth: 0, key: 'price', value: null, secret: true }])
})

it('should not take a lowercase or unprefixed name for a secret', () => {
  expect(read({ word: '$lower', plain: 'NAME' })).toEqual([
    { depth: 0, key: 'word', value: '$lower', secret: false },
    { depth: 0, key: 'plain', value: 'NAME', secret: false },
  ])
})

it('should say whether a configuration holds a secret', () => {
  expect(holds({ foo: 'plain' })).toBe(false)
  expect(holds({ apiKey: '$STRIPE_API_KEY' })).toBe(true)
  expect(holds({ nested: { deep: { key: '$KEY0' } } })).toBe(true)
  expect(holds({ keys: [{ key: '$KEY0' }] })).toBe(true)
  expect(holds({})).toBe(false)
})
