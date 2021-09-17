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
      id: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/token' }
    }
  })

  expect(schema.fit({ id: 'a2b3c' })).toBe(null)
})
