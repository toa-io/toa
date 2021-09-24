'use strict'

const { Schema } = require('../src/schema')

it('should fit', () => {
  const schema = new Schema({ type: 'integer' })
  const error = schema.fit(5)

  expect(error).toBeNull()
})

it('should set defaults', () => {
  const schema = new Schema({ properties: { a: { type: 'string', default: 'not set' } } })
  const value = {}

  schema.fit(value)

  expect(value.a).toBe('not set')
})

it('should provide defaults', () => {
  const schema = new Schema({ properties: { a: { type: 'string', default: 'not set' } } })
  const defaults = schema.defaults()

  expect(defaults).toStrictEqual({ a: 'not set' })
})

it('should return error', () => {
  const schema = new Schema({ type: 'integer' })
  const error = schema.fit('a')

  expect(error).not.toBeNull()
})

it('should format error', () => {
  const schema = new Schema({
    properties: {
      a: { type: 'integer' },
      b: { type: 'boolean' }
    },
    required: ['a']
  })

  let error = schema.fit({ a: 'wrong' })

  expect(error).toStrictEqual({
    message: 'a must be integer',
    keyword: 'type',
    property: 'a'
  })

  error = schema.fit({ b: true })

  expect(error).toStrictEqual({
    message: 'must have required property \'a\'',
    keyword: 'required',
    property: 'a'
  })
})

it('should have definitions', () => {
  const schema = new Schema({
    properties: {
      id: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/token' },
      remote: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/locator' },
      schema: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/schema' }
    }
  })

  expect(schema.fit({ id: 'a2b3c' })).toBe(null)
})

it('should define locator', () => {
  const schema = new Schema({
    properties: {
      event: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/locator' }
    }
  })

  expect(schema.fit({ event: 'a.b' })).toBe(null)
  expect(schema.fit({ event: 'a.b.c' })).toBe(null)
  expect(schema.fit({ event: 'a.b.c.d' })).toBe(null)
  expect(schema.fit({ event: 'a.1' })).not.toBe(null)
  expect(schema.fit({ event: 'a' })).not.toBe(null)
})

it('should define fqn', () => {
  const schema = new Schema({
    properties: {
      remote: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/fqn' }
    }
  })

  expect(schema.fit({ remote: 'a.b' })).toBe(null)
  expect(schema.fit({ remote: 'a.b.c' })).not.toBe(null)
  expect(schema.fit({ remote: 'a.b.c.d' })).not.toBe(null)
  expect(schema.fit({ remote: 'a.1' })).not.toBe(null)
  expect(schema.fit({ remote: 'a' })).not.toBe(null)
})
