'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

jest.mock('../../src/contract/conditions')

const { Request } = require('../../src/contract/request')
const { Conditions } = require('../../src/contract/conditions')
const fixtures = require('./contract.fixtures')

let contract

beforeEach(() => {
  jest.clearAllMocks()

  contract = new Request(fixtures.schema)
})

const dummy = { schema: { properties: {} } }

it('should extend Conditions', () => {
  expect(contract).toBeInstanceOf(Conditions)
  expect(Conditions).toHaveBeenCalledWith(fixtures.schema)
})

it('should fit request', () => {
  const request = { [generate()]: generate() }

  contract.fit(request)

  expect(Conditions.mock.instances[0].fit).toHaveBeenCalledWith(request)
})

describe('schema', () => {
  let schema

  beforeEach(() => {
    schema = clone(fixtures.schemas.request)
  })

  it('should provide schema', () => {
    expect(Request.schema({}, dummy)).toBeDefined()
  })

  it('should add required input if defined', () => {
    const input = { type: 'number' }

    expect(Request.schema({ input }, dummy).properties.input).toStrictEqual(input)
  })

  it('should set input as null if undefined', async () => {
    expect(Request.schema({}, dummy).properties.input).toStrictEqual({ type: 'null' })
  })

  it('should contain query if declaration.query is not defined', () => {
    expect(Request.schema({}, dummy).properties.query).toBeDefined()
  })

  it('should not contain query if declaration.query is false', () => {
    schema.properties.query = { type: 'null' }
    expect(Request.schema({ query: false }, dummy)).toStrictEqual(schema)
  })

  it('should require query if declaration.query is true', () => {
    schema.required = ['query']
    expect(Request.schema({ query: true }, dummy).required).toStrictEqual(expect.arrayContaining(['query']))
  })

  it('should forbid projection for non observations', () => {
    expect(Request.schema({ type: 'transition' }, dummy).properties.query.properties.projection)
      .toBe(undefined)

    expect(Request.schema({ type: 'assignment' }, dummy).properties.query.properties.projection)
      .toBe(undefined)

    expect(Request.schema({ type: 'observation' }, dummy).properties.query.properties.projection)
      .toBeDefined()
  })

  it('should forbid version for observations', () => {
    expect(Request.schema({ type: 'transition' }, dummy).properties.query.properties.version)
      .toBeDefined()

    expect(Request.schema({ type: 'observation' }, dummy).properties.query.properties.version)
      .toBe(undefined)
  })

  it('should allow omit, limit only for set observations', () => {
    const schema = Request.schema({ type: 'transition' }, dummy)
    const transition = schema.properties.query.properties

    expect(transition.omit).toBeUndefined()
    expect(transition.limit).toBeUndefined()

    const object = Request.schema({
      type: 'observation',
      scope: 'object'
    }, dummy).properties.query.properties

    expect(object.omit).toBeUndefined()
    expect(object.limit).toBeUndefined()

    const objects = Request.schema({
      type: 'observation',
      scope: 'objects'
    }, dummy).properties.query.properties

    expect(objects.omit).toBeDefined()
    expect(objects.limit).toBeDefined()
  })
})
