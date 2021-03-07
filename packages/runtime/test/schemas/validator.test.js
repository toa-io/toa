'use strict'

const { Validator } = require('../../src/schemas/validator')
const fixtures = require('./validator.fixtures')

let validator

beforeEach(() => {
  validator = new Validator()
  validator.add(fixtures.schemas.entity)
})

describe('validate', () => {
  it('should validate', () => {
    const validate = sample => validator.validate(fixtures.schemas.entity.$id, sample)

    expect(validate(fixtures.samples.entity.ok.all)).toBeTruthy()
    expect(validate(fixtures.samples.entity.invalid.type)).toBeFalsy()
    expect(validate(fixtures.samples.entity.invalid.required)).toBeFalsy()
  })

  it('should resolve references', () => {
    validator.add(fixtures.schemas.input)

    expect(validator.validate(fixtures.schemas.input.$id, fixtures.samples.input.ok)).toBeTruthy()
    expect(validator.validate(fixtures.schemas.input.$id, fixtures.samples.input.invalid)).toBeFalsy()
  })

  it('should set defaults', () => {
    const value = { ...fixtures.samples.entity.ok.required }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(value.baz).toBe(fixtures.schemas.entity.properties.baz.default)
  })

  it('should forbid additional properties', () => {
    const value = { extra: 'property', ...fixtures.samples.entity.ok.all }

    expect(validator.validate(fixtures.schemas.entity.$id, value)).toBeFalsy()
  })

  it('should throw on unknown schema', () => {
    expect(() => validator.validate('wrong', {})).toThrow(/no schema/)
    expect(() => validator.defaults('wrong')).toThrow(/Unknown schema/)
  })

  it('should validate by reference', () => {
    const validate = (property, value) =>
      validator.validate(`${fixtures.schemas.entity.$id}#/properties/${property}`, value)

    expect(validate('foo', 'ok')).toBeTruthy()
    expect(validate('foo', 1)).toBeFalsy()
  })
})

describe('add', () => {
  it('should throw on non-object type schema', () => {
    expect(() => validator.add({ type: 'number' })).toThrow(/must be an object type/)
  })

  it('should throw if no id', () => {
    expect(() => validator.add({ type: 'object' })).toThrow(/must contain unique \$id/)
  })

  it('should throw on duplicates', () => {
    expect(() => validator.add(fixtures.schemas.entity)).toThrow(/already exists/)
  })
})

describe('defaults', () => {
  it('should provide defaults', () => {
    const properties = fixtures.schemas.entity.properties
    const defaults = Object.fromEntries(Object.keys(properties).map(key => [key, properties[key].default]))
    const value = validator.defaults(fixtures.schemas.entity.$id)

    expect(value).toStrictEqual(defaults)
  })
})

describe('errors', () => {
  it('should provide empty errors', () => {
    validator.validate(fixtures.schemas.entity.$id, fixtures.samples.entity.ok.all)

    expect(validator.error()).toBeNull()
    expect(validator.errors).toBeNull()
  })

  it('should provide error text', () => {
    const value = { ...fixtures.samples.entity.invalid.type }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(validator.error()).toBe('object/foo should be string')
    expect(validator.error('entity')).toBe('entity/foo should be string')
  })

  it('should format type error', () => {
    const value = { ...fixtures.samples.entity.invalid.type }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(validator.errors).toStrictEqual([{
      keyword: 'type',
      property: 'foo',
      message: 'should be string'
    }])
  })

  it('should format missing property error', () => {
    const value = { ...fixtures.samples.entity.invalid.required }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(validator.errors).toStrictEqual([{
      keyword: 'required',
      message: 'should have required property \'foo\'',
      property: 'foo'
    }])
  })

  it('should format extra property error', () => {
    const value = { extra: 'prop', ...fixtures.samples.entity.ok.all }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(validator.errors).toEqual([{
      keyword: 'additionalProperties',
      message: 'should NOT have additional properties',
      property: 'extra'
    }])
  })
})
