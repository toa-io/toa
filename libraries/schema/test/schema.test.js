'use strict'

const { Schema } = require('../')

describe('fit', () => {
  it('should fit', () => {
    const schema = new Schema({ type: 'integer' })
    const error = schema.fit(5)

    expect(error).toBeNull()
  })

  it('should set defaults', () => {
    const schema = new Schema({ type: 'object', properties: { a: { type: 'string', default: 'not set' } } })
    const value = {}

    schema.fit(value)

    expect(value.a).toBe('not set')
  })

  it('should provide defaults', () => {
    const schema = new Schema({ type: 'object', properties: { a: { type: 'string', default: 'not set' } } })
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
      type: 'object',
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
})

describe('validate', () => {
  it('should fit', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        foo: {
          type: 'integer'
        }
      }
    })

    const value = { foo: 5 }

    expect(() => schema.validate(value)).not.toThrow()
    expect(value.foo).toStrictEqual(5)
  })

  it('should throw validation errors', () => {
    const schema = new Schema({
      type: 'object',
      properties: {
        foo: {
          type: 'integer'
        }
      }
    })

    const value = { foo: 'not-an-integer' }

    expect(() => schema.validate(value)).toThrow(TypeError)
  })
})

describe('match', () => {
  const schema = new Schema({
    type: 'object',
    properties: {
      a: { type: 'integer' },
      b: { type: 'boolean', default: false },
      c: {
        type: 'object',
        properties: {
          d: {
            type: 'number',
            default: 1
          },
          default: { type: 'string' }
        }
      },
      required: { type: 'string' },
      default: { type: 'string' }
    },
    additionalProperties: false,
    required: ['a']
  })

  it('should match', () => {
    expect(schema.match({ a: 1 })).toStrictEqual(null)

    expect(schema.match({ a: 'not-a-number' })).toMatchObject({
      property: 'a',
      schema: '#/properties/a/type'
    })

    expect(schema.match({})).toMatchObject({
      property: 'a',
      schema: '#/required'
    })
  })

  it('should not set defaults', () => {
    const value = { a: 1 }

    schema.match(value)

    expect(value).toStrictEqual({ a: 1 })
  })

  it('should not set nested defaults', () => {
    const value = { a: 1, c: {} }

    schema.match(value)

    expect(value).toStrictEqual({ a: 1, c: {} })
  })

  it('should not delete properties with name \'required\'', () => {
    const value = { a: 1, required: 'foo' }

    expect(schema.match(value)).toStrictEqual(null)
  })

  it('should not delete properties with name \'default\'', () => {
    const value = { a: 1, default: 'foo' }

    expect(schema.match(value)).toStrictEqual(null)
  })
})

describe('adapt', () => {
  const schema = new Schema({
    type: 'object',
    properties: {
      a: { type: 'integer' },
      b: { type: 'boolean', default: false },
      required: { type: 'string' },
      default: { type: 'string' }
    },
    additionalProperties: false,
    required: ['a']
  })

  it('should match', () => {
    expect(schema.adapt({ a: 1 })).toStrictEqual(null)

    expect(schema.adapt({ a: 'not-a-number' })).toMatchObject({
      property: 'a',
      schema: '#/properties/a/type'
    })
  })

  it('should not set defaults', () => {
    const value = { a: 1 }

    schema.adapt(value)

    expect(value.b).toStrictEqual(undefined)
  })

  it('should not delete properties with name \'required\'', () => {
    const value = { a: 1, required: 'foo' }

    expect(schema.adapt(value)).toStrictEqual(null)
  })

  it('should not delete properties with name \'default\'', () => {
    const value = { a: 1, default: 'foo' }

    expect(schema.adapt(value)).toStrictEqual(null)
  })
})

describe('formats', () => {
  it('should support ajv-formats', () => {
    const schema = new Schema({
      type: 'object',
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
      type: 'object',
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
      type: 'object',
      properties: {
        event: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/endpoint' }
      }
    })

    expect(schema.fit({ event: 'a.b.c' })).toBe(null)
    expect(schema.fit({ event: 'a.b' })).not.toBe(null)
    expect(schema.fit({ event: 'a.b.c.d' })).not.toBe(null)
    expect(schema.fit({ event: 'a.1' })).not.toBe(null)
    expect(schema.fit({ event: 'a-b.c' })).not.toBe(null)
    expect(schema.fit({ event: 'a' })).not.toBe(null)
  })

  it('should define locator', () => {
    const schema = new Schema({
      type: 'object',
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
      type: 'object',
      properties: {
        foo: { $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/label' }
      }
    })

    expect(schema.fit({ foo: 'a' })).toBe(null)
    expect(schema.fit({ foo: 'a-b' })).toBe(null)
    expect(schema.fit({ foo: 'a-b-c' })).toBe(null)
    expect(schema.fit({ foo: 'a-1' })).not.toBe(null)
    expect(schema.fit({ foo: 'a.b' })).not.toBe(null)
  })

  it('should define version', () => {
    const schema = new Schema({
      type: 'object',
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
        type: 'object',
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
