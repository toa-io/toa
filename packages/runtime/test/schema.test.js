const { Schema } = require('../src/schema')
const fixtures = require('./schema.fixtures')

let schema

beforeEach(() => {
  schema = new Schema(fixtures.schema)
})

describe('validation', () => {
  it('should validate', () => {
    expect(schema.fit(fixtures.samples.ok.all).ok).toBeTruthy()
    expect(schema.fit(fixtures.samples.invalid.type).ok).toBeFalsy()
    expect(schema.fit(fixtures.samples.invalid.required).ok).toBeFalsy()
  })

  it('should set defaults', () => {
    const sample = { ...fixtures.samples.ok.required }

    schema.fit(sample)

    expect(sample.baz).toBe(fixtures.schema.properties.baz.default)
  })

  it('should forbid additional properties', () => {
    const sample = { extra: 'property', ...fixtures.samples.ok.all }

    expect(schema.fit(sample).ok).toBeFalsy()
  })

  it('should throw on non-object type schema', () => {
    const ctor = () => new Schema({ type: 'number' })

    expect(ctor).toThrow(/must be object type/)
  })
})

describe('errors', () => {
  it('should format type error', () => {
    const sample = { ...fixtures.samples.invalid.type }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'type',
      property: 'foo',
      message: 'should be string'
    })])
  })

  it('should format missing property error', () => {
    const sample = { ...fixtures.samples.invalid.required }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'required',
      property: 'foo'
    })])
  })

  it('should format extra property error', () => {
    const sample = { useless: 'prop', ...fixtures.samples.ok.all }

    const result = schema.fit(sample)

    expect(result.errors).toEqual([expect.objectContaining({
      keyword: 'additionalProperties',
      property: 'useless'
    })])
  })
})
