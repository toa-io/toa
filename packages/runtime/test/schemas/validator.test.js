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

  it('should set defaults with refs', () => {
    const value = { ...fixtures.samples.input.ok }

    validator.validate(fixtures.schemas.entity.$id, value)

    expect(value.baz).toBe(fixtures.schemas.entity.properties.baz.default)
  })

  it('should throw on unknown schema', () => {
    expect(() => validator.validate('wrong', {})).toThrow(/no schema/)
    expect(() => validator.defaults('wrong')).toThrow(/Unknown schema/)
  })

  it('should return undefined if not strict', () => {
    expect(validator.validate('wrong', {}, false)).not.toBeDefined()
  })

  it('should validate by reference', () => {
    const validate = (property, value) =>
      validator.validate(`${fixtures.schemas.entity.$id}#/properties/${property}`, value)

    expect(validate('foo', 'ok')).toBeTruthy()
    expect(validate('foo', 1)).toBeFalsy()
  })
})

describe('add', () => {
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

describe('constrained', () => {
  const constraint = 'schema://users/users/query'

  beforeEach(() => {
    const schema = validator.constrained(fixtures.schemas.entity.$id, {
      $id: constraint,
      properties: {
        baz: {
          minimum: 50
        }
      }
    })

    validator.add(schema)
  })

  it('should be ok', () => {
    const value = { baz: 50 }
    const result = validator.validate(constraint, value)

    console.log(validator.error())
    expect(result).toBe(true)
  })

  it('should add constraints', async () => {
    const value = { baz: 10 }
    const result = validator.validate(constraint, value)

    expect(result).toBe(false)
    expect(validator.error('entity')).toBe('entity/baz should be >= 50')
  })

  it('should remove difference', () => {
    const value = { bar: 10 }
    const result = validator.validate(constraint, value)

    expect(result).toBe(false)
  })

  it('should remove defaults', () => {
    const value = { ...fixtures.samples.entity.ok.all }
    delete value.baz

    validator.validate(constraint, value)
    expect('baz' in value).toBe(false)
  })

  it('should treat null as a copy', () => {
    const constraint = {
      $id: 'test',
      properties: {
        foo: null,
        baz: null
      }
    }

    const schema = validator.constrained(fixtures.schemas.entity.$id, constraint)

    validator.add(schema)

    const ok = { foo: 'value', baz: 10 }
    const wrong = { foo: 'value', baz: 'not-a-number' }

    expect(validator.validate('test', ok)).toBe(true)
    expect(validator.validate('test', wrong)).toBe(false)

    const def = { foo: 'value' }

    validator.validate('test', def)
    expect('baz' in def).toBe(false)
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
})
