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
const annotation = { default: 'pg://host0/db/sch/tbl' }

/** @type {toa.norm.context.dependencies.Instance[]} */
let instances

beforeEach(() => {
  jest.clearAllMocks()

  instances = dependencies.instances()
})

it('should throw if annotation is not defined', () => {
  expect(() => deployment(instances, undefined)).toThrow('pointer annotation is required')
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
