'use strict'

const { generate } = require('randomstring')
const { dependencies } = require('@toa.io/libraries/mock')

const mock = { deployment: jest.fn(() => generate()), Pointer: function () {} }

jest.mock('@toa.io/libraries/pointer', () => mock)
const { deployment } = require('../')

it('should be', () => {
  expect(deployment).toBeDefined()
})

/** @type {toa.pointer.URIs} */
let annotation

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

beforeEach(() => {
  jest.clearAllMocks()

  instances = dependencies.instances()
  annotation = { default: 'pg://host0/db' }
})

it('should throw if annotation is not defined', () => {
  expect(() => deployment(instances, undefined)).toThrow('annotation is required')
})

it('should throw if annotation is null', () => {
  expect(() => deployment(instances, null)).toThrow('annotation is required')
})

it('should throw if annotation is not a string or an object', () => {
  expect(() => deployment(instances, 1)).toThrow('annotation must be a string or an object')
})

it('should pass prefix', () => {
  const prefix = 'storages-sql'
  const options = { prefix }

  deployment(instances, annotation)

  expect(mock.deployment).toHaveBeenCalledWith(instances, annotation, options)
})

it('should return value', () => {
  const output = deployment(instances, annotation)

  expect(output).toStrictEqual(mock.deployment.mock.results[0].value)
})

describe('validation', () => {
  const call = () => deployment(instances, annotation)

  it('should throw path is not defined', () => {
    annotation = { default: 'pg://host0' }

    expect(call).toThrow('SQL annotation \'default\' must contain path')
  })

  it('should throw if common value contain table', () => {
    annotation = { default: 'pg://host0/db/sch/tbl' }

    expect(call).toThrow('SQL annotation \'default\' must not contain table name')

    annotation = 'pg://host0/db/sch/tbl'

    expect(call).toThrow('SQL annotation \'default\' must not contain table name')

    annotation = { dummies: 'pg://host0/db/sch/tbl' }

    expect(call).toThrow('SQL annotation \'dummies\' must not contain table name')
  })

  it('should throw if default contains schema', () => {
    annotation = 'mysql://host0/db/sch'

    expect(call).toThrow('SQL annotation \'default\' must not contain schema name')
  })

  it('should throw if database is empty', () => {
    annotation = 'mysql://host0/'

    expect(call).toThrow('SQL annotation \'default\' database name must not be empty')
  })
})
