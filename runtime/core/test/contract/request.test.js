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
    expect(Request.schema({})).toBeDefined()
  })

  it('should add required input if defined', () => {
    const input = { type: 'number' }

    expect(Request.schema({ input }).properties.input).toStrictEqual(input)
  })

  it('should set input as null if undefined', async () => {
    expect(Request.schema({}).properties.input).toStrictEqual({ type: 'null' })
  })

  it('should contain query if declaration.query is not defined', () => {
    expect(Request.schema({}).properties.query).toBeDefined()
  })

  it('should not contain query if declaration.query is false', () => {
    delete schema.properties.query
    schema.not = { required: ['query'] }
    expect(Request.schema({ query: false })).toStrictEqual(schema)
  })

  it('should require query if declaration.query is true', () => {
    schema.required = ['query']
    expect(Request.schema({ query: true }).required).toStrictEqual(expect.arrayContaining(['query']))
  })

  it('should forbid projection for non observations', () => {
    expect(Request.schema({ type: 'transition' }).properties.query.properties.projection)
      .toBe(undefined)

    expect(Request.schema({ type: 'assignment' }).properties.query.properties.projection)
      .toBe(undefined)

    expect(Request.schema({ type: 'observation' }).properties.query.properties.projection)
      .toBeDefined()
  })

  it('should forbid version for observations', () => {
    expect(Request.schema({ type: 'transition' }).properties.query.properties.version)
      .toBeDefined()

    expect(Request.schema({ type: 'observation' }).properties.query.properties.version)
      .toBe(undefined)
  })

  it('should allow omit, limit only for set observations', () => {
    const transition = Request.schema({ type: 'transition' }).properties.query.properties

    expect(transition.omit).toBeUndefined()
    expect(transition.limit).toBeUndefined()

    const entity = Request.schema({
      type: 'observation',
      scope: 'object'
    }).properties.query.properties

    expect(entity.omit).toBeUndefined()
    expect(entity.limit).toBeUndefined()

    const set = Request.schema({
      type: 'observation',
      scope: 'objects'
    }).properties.query.properties

    expect(set.omit).toBeDefined()
    expect(set.limit).toBeDefined()
  })
})
