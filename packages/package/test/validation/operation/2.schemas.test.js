'use strict'

const path = require('path')

const { validation } = require('../../../src/validation/validation')
const fixtures = require('./2.schemas.fixtures')

const validate = validation(
  path.resolve(__dirname, '../../../src/validation/rules/operation'),
  '2.schemas.js'
)

describe('query', () => {
  it('should be undefined if no query', () => {
    const { operation } = fixtures.sample.query('undefined')

    validate(operation)

    expect(operation.schemas).toBeUndefined()
  })

  it('should create default schema', () => {
    const { operation, ok } = fixtures.sample.query('default')

    validate(operation, fixtures.manifest)

    expect(operation.schemas.query).toEqual(ok)
  })
})

describe('criteria', () => {
  it('should be undefined if no criteria', () => {
    const { operation } = fixtures.sample.criteria('undefined')

    validate(operation)

    expect(operation.schemas.criteria).toBeUndefined()
  })

  it('should create criteria schema with matched properties', () => {
    const { operation, ok } = fixtures.sample.criteria('properties')

    validate(operation, fixtures.manifest)

    expect(operation.schemas.criteria).toEqual(ok)
  })

  it('should create criteria schema with property extensions', () => {
    const { operation, ok } = fixtures.sample.criteria('extension')

    validate(operation, fixtures.manifest)

    expect(operation.schemas.criteria).toEqual(ok)
  })
})
