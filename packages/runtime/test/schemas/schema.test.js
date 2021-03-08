const { Schema } = require('../../src/schemas/schema')
const fixtures = require('./schema.fixtures')

let schema

beforeEach(() => {
  jest.clearAllMocks()

  schema = new Schema(fixtures.id, fixtures.validator)
})

it('should expose error', () => {
  const error = schema.error

  expect(error).toBe(fixtures.validator.error.mock.results[0].value)
})

it('should expose errors', () => {
  const errors = schema.errors

  expect(errors).toBe(fixtures.validator.errors)
})

it('should fit', () => {
  const value = { foo: 'bar' }

  schema.fit(value)

  expect(fixtures.validator.validate).toHaveBeenCalledWith(fixtures.id, value)
})

it('should expose defaults', () => {
  const value = schema.defaults()

  expect(value).toBe(fixtures.validator.defaults.mock.results[0].value)
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
    expect(assign).toThrow()
  })

  it('should not throw on additional properties', () => {
    const assign = () => (proxy.foo = 'additional')

    expect(assign).not.toThrow()
    expect(fixtures.validator.validate.mock.results[0].value).not.toBeDefined()
  })
})
