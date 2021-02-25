const { Schema } = require('../src/schema')
const assets = require('./schema.assets')

let schema

beforeEach(() => {
  schema = new Schema(assets.schema)
})

describe('validation', () => {
  it('should validate', () => {
    expect(schema.fit(assets.samples.ok.all).ok).toBeTruthy()
    expect(schema.fit(assets.samples.invalid.type).ok).toBeFalsy()
    expect(schema.fit(assets.samples.invalid.required).ok).toBeFalsy()
  })

  it('should set defaults', () => {
    const sample = { ...assets.samples.ok.required }

    schema.fit(sample)

    expect(sample.baz).toBe(assets.schema.properties.baz.default)
  })

  it('should forbid additional properties', () => {
    const sample = { extra: 'property', ...assets.samples.ok.all }

    expect(schema.fit(sample).ok).toBeFalsy()
  })

  it('should throw on non-object type schema', () => {
    const ctor = () => new Schema({ type: 'number' })

    expect(ctor).toThrow(/must be an object type/)
  })
})

describe('errors', () => {
  it('should format type error', () => {
    const sample = { ...assets.samples.invalid.type }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'type',
      property: 'foo',
      message: 'should be string'
    })])
  })

  it('should format missing property error', () => {
    const sample = { ...assets.samples.invalid.required }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'required',
      property: 'foo'
    })])
  })

  it('should format extra property error', () => {
    const sample = { useless: 'prop', ...assets.samples.ok.all }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'additionalProperties',
      property: 'useless'
    })])
  })
})
