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
    expect(Request.schema()).toStrictEqual(schema)
  })

  it('should add required input', () => {
    const input = { type: 'number' }

    schema.properties.input = input
    schema.required = ['input']

    expect(Request.schema({ input })).toStrictEqual(schema)
  })

  it('should contain query if declaration.query is not defined', () => {
    expect(Request.schema({})).toStrictEqual(schema)
  })

  it('should not contain query if declaration.query is false', () => {
    delete schema.properties.query
    expect(Request.schema({ query: false })).toStrictEqual(schema)
  })

  it('should require query if declaration.query is true', () => {
    schema.required = ['query']
    expect(Request.schema({ query: true })).toStrictEqual(schema)
  })
})
