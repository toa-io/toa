'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

jest.mock('../../src/contract/contract')

const { Request } = require('../../src/contract/request')
const { Contract } = require('../../src/contract/contract')
const fixtures = require('./contract.fixtures')

let contract

beforeEach(() => {
  jest.clearAllMocks()

  contract = new Request(fixtures.schema, {})
})

const dummy = { schema: { properties: {} } }

it('should extend Conditions', () => {
  expect(contract).toBeInstanceOf(Contract)
  expect(Contract).toHaveBeenCalledWith(fixtures.schema)
})

it('should fit request', () => {
  const request = { [generate()]: generate() }

  contract.fit(request)

  expect(Contract.mock.instances[0].fit).toHaveBeenCalledWith(request)
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
    expect(Request.schema({ query: false }, dummy)).toMatchObject(schema)
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

describe('source', () => {
  const schemas = require('@toa.io/schemas')

  const compile = (definition, entity) =>
    schemas.schema(Request.schema(definition, entity), { removeAdditional: true })

  it('should declare source', () => {
    const schema = Request.schema({}, dummy)

    expect(schema.properties.source).toBeDefined()
    expect(schema.properties.source.additionalProperties).toStrictEqual(false)
  })

  it('should pass known source variants', () => {
    const schema = compile({}, undefined)

    for (const source of [
      { namespace: 'a', component: 'b', operation: 'c' },
      { namespace: 'a', component: 'b', event: 'c' },
      { service: 'exposition' }
    ]) {
      const request = { input: null, query: null, source }

      expect(schema.fit(request)).toStrictEqual(null)
      expect(request.source).toStrictEqual(source)
    }
  })

  // `source` crosses the wire and keys the introspection map, so whatever
  // a peer adds to it must not survive
  it('should strip unknown source properties', () => {
    const schema = compile({}, undefined)
    const request = { input: null, query: null, source: { service: 'exposition', evil: 'x' } }

    expect(schema.fit(request)).toStrictEqual(null)
    expect(request.source).toStrictEqual({ service: 'exposition' })
  })
})
