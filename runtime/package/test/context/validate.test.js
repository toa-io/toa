'use strict'

const clone = require('clone-deep')

const { validate } = require('../../src/context/validate')
const fixtures = require('./validate.fixtures')

let context

beforeAll(() => {
  expect(() => validate(fixtures.context)).not.toThrow()
})

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should require runtime version as semver', () => {
  delete context.runtime
  expect(() => validate(context)).toThrow(/required/)

  context.runtime = 'foo'
  expect(() => validate(context)).toThrow(/pattern/)
})

it('should allow local runtime version', () => {
  context.runtime = '.'
  expect(() => validate(context)).not.toThrow()
})

it('should require name as token', () => {
  delete context.name
  expect(() => validate(context)).toThrow(/required/)

  context.name = 'foo bar'
  expect(() => validate(context)).toThrow(/pattern/)
})

it('should require packages location', () => {
  delete context.packages
  expect(() => validate(context)).toThrow(/required/)
})

it('should require registry url', () => {
  delete context.registry
  expect(() => validate(context)).toThrow(/required/)
})
