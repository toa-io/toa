'use strict'

const { AssertionError } = require('node:assert')
const { dump } = require('@toa.io/yaml')

const tomato = require('@toa.io/tomato')
const { mock: schema } = require('./schema.fixtures')
const mock = { tomato, schema }

jest.mock('@cucumber/cucumber', () => mock.tomato)
jest.mock('../../../source/expand', () => mock.schema)

const { is } = require('@toa.io/schemas')

require('../schema')

it('should be', () => undefined)

/** @type {toa.schema.features.Context} */
let context

beforeEach(() => {
  context = {}
})

describe('When I write schema:', () => {
  const step = tomato.steps.Wh('I write schema:')

  it('should be', () => undefined)

  it('should define schema', () => {
    const schema = { type: 'number' }
    const yaml = dump(schema)

    step.call(context, yaml)

    expect(mock.schema.expand).toHaveBeenCalledWith(schema, is)
    expect(context.schema).toStrictEqual(schema)
  })
})

describe('Then it is equivalent to:', () => {
  const step = tomato.steps.Th('it is equivalent to:')

  it('should be', () => undefined)

  it('should throw if no schema defined', () => {
    expect(() => step.call(context)).toThrow('No schema given')
  })

  it('should not pass if schemas mismatch', () => {
    const schema = { type: 'boolean' }
    const reference = { type: 'number' }
    const yaml = dump(reference)

    context.schema = schema

    expect(() => step.call(context, yaml)).toThrow(AssertionError)
  })

  it('should pass if schemas match', () => {
    const schema = { type: 'number' }
    const reference = { type: 'number' }
    const yaml = dump(reference)

    context.schema = schema

    expect(() => step.call(context, yaml)).not.toThrow(AssertionError)
  })
})
