const { Schema } = require('../src/schema')
const fixtures = require('./schema.fixtures')

let schema

beforeEach(() => {
  schema = new Schema(fixtures.schema)
})

describe('fit', () => {
  it('should validate', () => {
    expect(schema.fit(fixtures.samples.ok.all)).toBeTruthy()
    expect(schema.fit(fixtures.samples.invalid.type)).toBeFalsy()
    expect(schema.fit(fixtures.samples.invalid.required)).toBeFalsy()
  })

  it('should provide empty errors', () => {
    schema.fit(fixtures.samples.ok.all)

    expect(schema.error).toBeNull()
    expect(schema.errors).toBeNull()
  })

  it('should set defaults', () => {
    const sample = { ...fixtures.samples.ok.required }

    schema.fit(sample)

    expect(sample.baz).toBe(fixtures.schema.properties.baz.default)
  })

  it('should forbid additional properties', () => {
    const sample = { extra: 'property', ...fixtures.samples.ok.all }

    expect(schema.fit(sample)).toBeFalsy()
  })

  it('should throw on non-object type schema', () => {
    const ctor = () => new Schema({ type: 'number' })

    expect(ctor).toThrow(/must be object type/)
  })

  describe('errors', () => {
    it('should provide error text', () => {
      const sample = { ...fixtures.samples.invalid.type }

      schema.fit(sample)

      expect(schema.error).toBe('object/foo should be string')
    })

    it('should format type error', () => {
      const sample = { ...fixtures.samples.invalid.type }

      schema.fit(sample)

      expect(schema.errors).toEqual([expect.objectContaining({
        keyword: 'type',
        property: 'foo',
        message: 'should be string'
      })])
    })

    it('should format missing property error', () => {
      const sample = { ...fixtures.samples.invalid.required }

      schema.fit(sample)

      expect(schema.errors).toEqual([expect.objectContaining({
        keyword: 'required',
        property: 'foo'
      })])
    })

    it('should format extra property error', () => {
      const sample = { useless: 'prop', ...fixtures.samples.ok.all }

      schema.fit(sample)

      expect(schema.errors).toEqual([expect.objectContaining({
        keyword: 'additionalProperties',
        property: 'useless'
      })])
    })
  })
})

describe('defaults', () => {
  it('should return defaults', () => {
    const value = schema.defaults()

    expect(value).toStrictEqual({ baz: fixtures.schema.properties.baz.default })
  })
})

describe('proxy', () => {
  let proxy

  beforeEach(() => {
    proxy = schema.proxy({})
  })

  it('should assign properties', () => {
    proxy.foo = 'bar'

    expect(proxy.foo).toBe('bar')
  })

  it('should throw on invalid assignment', () => {
    const assign = () => (proxy.foo = 5)
    expect(assign).toThrow(/foo should be string/)
  })
})
