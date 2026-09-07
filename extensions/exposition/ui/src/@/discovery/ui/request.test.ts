import { it, expect } from 'vitest'
import { address, blank, bodied, fields, hint, skeleton, slug } from './request'
import type { Method } from '@/discovery'

it('should ask for what the template names', () => {
  const of: Method = { route: { id: { type: 'string', title: 'Which pot' } } }

  expect(fields('/pots/:id', of)).toStrictEqual([
    {
      key: 'route:1',
      name: 'id',
      where: 'route',
      schema: { type: 'string', title: 'Which pot' },
      required: true,
    },
  ])
})

it('should ask for a wildcard', () => {
  expect(fields('/files/**', {}).map((field) => field.name)).toStrictEqual(['**'])
  expect(fields('/files/*/meta', {}).map((field) => field.key)).toStrictEqual(['route:1'])
})

it('should ask for every parameter a resource declares', () => {
  const of: Method = { query: { limit: { type: 'number' } } }

  expect(fields('/pots', of)).toStrictEqual([
    { key: 'query:limit', name: 'limit', where: 'query', schema: { type: 'number' }, required: false },
  ])
})

it('should leave a variable without a schema where the name is not answered', () => {
  const of: Method = { route: { a: { type: 'string' } } }

  expect(fields('/pots/:first', of)[0]?.schema).toBe(null)
})

it('should tell whether it carries a body', () => {
  expect(bodied('POST', {})).toBe(false)
  expect(bodied('POST', { input: {} })).toBe(false)
  expect(bodied('POST', { input: { type: 'object' } })).toBe(true)
})

it('should carry no body where the verb has none', () => {
  expect(bodied('GET', { input: { type: 'object' } })).toBe(false)
  expect(bodied('HEAD', { input: { type: 'object' } })).toBe(false)
  expect(bodied('DELETE', { input: { type: 'object' } })).toBe(false)
})

it('should address the trunk', () => {
  expect(address('/', [], {})).toBe('/')
})

it('should address a route with its trailing slash', () => {
  expect(address('/pots', [], {})).toBe('/pots/')
})

it('should fill what the template takes', () => {
  const of: Method = {}
  const form = fields('/pots/:id', of)

  expect(address('/pots/:id', form, { 'route:1': 'one two' })).toBe('/pots/one%20two/')
})

it('should keep the separators of the rest of a path', () => {
  const form = fields('/files/**', {})

  expect(address('/files/**', form, { 'route:1': 'a b/c' })).toBe('/files/a%20b/c/')
})

it('should carry what was filled in as a querystring', () => {
  const form = fields('/pots', { query: { limit: {}, sort: {} } })

  expect(address('/pots', form, { 'query:limit': '10', 'query:sort': '' })).toBe(
    '/pots/?limit=10',
  )
})

it('should start a body from what the schema takes', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      size: { type: 'integer' },
      open: { type: 'boolean' },
      tags: { type: 'array', items: { type: 'string' } },
      kind: { enum: ['pot', 'pan'] },
    },
  }

  expect(JSON.parse(skeleton(schema))).toStrictEqual({
    name: '',
    size: 0,
    open: false,
    tags: [''],
    kind: 'pot',
  })
})

it('should say what a value of it is', () => {
  expect(hint({ type: 'string' })).toBe('string')
  expect(hint({ type: ['number', 'null'] })).toBe('number | null')
  expect(hint(null)).toBe('string')
})

it('should name a route', () => {
  expect(slug('/pots/:id')).toBe('pots-id')
  expect(slug('/')).toBe('root')
  expect(slug('/files/**')).toBe('files')
})

it('should say what the call cannot be made without', () => {
  const form = fields('/pots/:id', { query: { limit: {} } })

  expect(blank(form, {})).toStrictEqual(['route:1'])
  expect(blank(form, { 'route:1': '  ' })).toStrictEqual(['route:1'])
  expect(blank(form, { 'route:1': 'a' })).toStrictEqual([])
})
