'use strict'

const { Schema } = require('../')

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
    property: 'a',
    path: '/a',
    schema: '#/properties/a/type'
  })

  error = schema.fit({ b: true })

  expect(error).toStrictEqual({
    message: 'must have required property \'a\'',
    keyword: 'required',
    property: 'a',
    schema: '#/required'
  })
})

describe('formats', () => {
  it('should support ajv-formats', () => {
    const schema = new Schema({
      properties: {
        url: {
          type: 'string',
          format: 'uri'
        }
      }
    })

    expect(schema.fit({ url: 'localhost:5050' })).toBe(null)
    expect(schema.fit({ url: 'https://github.com/a/b' })).toBe(null)
    expect(schema.fit({ url: 'not-a-uri' })).not.toBe(null)
  })
})

describe('definitions', () => {
  it('should have definitions', () => {
    const schema = new Schema({
      properties: {
        id: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/token' },
        remote: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/locator' },
        schema: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/schema' }
      }
    })

    expect(schema.fit({ id: 'a2b3c' })).toBe(null)
  })

  it('should define endpoint', () => {
    const schema = new Schema({
      properties: {
        event: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/endpoint' }
      }
    })

    expect(schema.fit({ event: 'a.b' })).toBe(null)
    expect(schema.fit({ event: 'a.b.c' })).toBe(null)
    expect(schema.fit({ event: 'a.b.c.d' })).toBe(null)
    expect(schema.fit({ event: 'a.1' })).not.toBe(null)
    expect(schema.fit({ event: 'a-b.c' })).not.toBe(null)
    expect(schema.fit({ event: 'a' })).not.toBe(null)
  })

  it('should define locator', () => {
    const schema = new Schema({
      properties: {
        remote: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/locator' }
      }
    })

    expect(schema.fit({ remote: 'a.b' })).toBe(null)
    expect(schema.fit({ remote: 'a.b.c' })).not.toBe(null)
    expect(schema.fit({ remote: 'a.1' })).not.toBe(null)
    expect(schema.fit({ remote: 'a-b.c' })).not.toBe(null)
    expect(schema.fit({ remote: 'a' })).not.toBe(null)
  })

  it('should define label', () => {
    const schema = new Schema({
      properties: {
        foo: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/label' }
      }
    })

    expect(schema.fit({ foo: 'a-b' })).toBe(null)
    expect(schema.fit({ foo: 'a-b-c' })).not.toBe(null)
    expect(schema.fit({ foo: 'a-1' })).not.toBe(null)
    expect(schema.fit({ foo: 'a.b' })).not.toBe(null)
    expect(schema.fit({ foo: 'a' })).not.toBe(null)
  })

  it('should define version', () => {
    const schema = new Schema({
      properties: {
        version: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/version' }
      }
    })

    expect(schema.fit({ version: '1.0.0' })).toBe(null)
    expect(schema.fit({ version: '1.0' })).not.toBe(null)
    expect(schema.fit({ version: 'wrong' })).not.toBe(null)
  })
})

describe('keywords', () => {
  describe('system', () => {
    it('should modify property to readonly', () => {
      const schema = new Schema({
        properties: {
          foo: {
            type: 'string',
            system: true
          }
        }
      })

      const value = { foo: 'ok' }
      const result = schema.fit(value)

      expect(result).toBe(null)
      expect(() => (value.foo = 'not ok')).toThrow(/Cannot assign to read only property/)
      expect(value.foo).toBe('ok')
      expect(Object.keys(value)).toStrictEqual(['foo'])
    })

    it('should not throw on non-objects', () => {
      const schema = new Schema({
        type: 'string',
        system: true
      })

      expect(schema.fit('ok')).toBe(null)
    })
  })
})
