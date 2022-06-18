'use strict'

const clone = require('clone-deep')

const { validate } = require('../../src/.context')
const fixtures = require('./validate.fixtures')

let context

beforeAll(() => {
  expect(() => validate(fixtures.context)).not.toThrow()
})

beforeEach(() => {
  context = clone(fixtures.context)
})

describe('runtime', () => {
  it('should require', () => {
    delete context.runtime
    expect(() => validate(context)).toThrow(/required/)
  })

  it('should require version as semver', () => {
    delete context.runtime.version
    expect(() => validate(context)).toThrow(/required/)

    context.runtime.version = '.'
    expect(() => validate(context)).toThrow(/pattern/)
  })

  it('should require registry to match uri format', () => {
    context.runtime.registry = 'not-a-uri'
    expect(() => validate(context)).toThrow(/must match format/)

    context.runtime.registry = 'http://localhost'
    expect(() => validate(context)).not.toThrow()
  })

  it('should require proxy to match uri format', () => {
    context.runtime.proxy = 'not-a-uri'
    expect(() => validate(context)).toThrow(/must match format/)

    context.runtime.proxy = 'http://localhost'
    expect(() => validate(context)).not.toThrow()
  })
})

describe('registry', () => {
  it('should require', () => {
    delete context.registry

    expect(() => validate(context)).toThrow(/required property 'registry'/)
  })

  it('should require base', () => {
    delete context.registry.base

    expect(() => validate(context)).toThrow(/required property 'base'/)
  })

  it('should set default platforms', () => {
    delete context.registry.platforms

    validate(context)

    expect(context.registry.platforms).toBeInstanceOf(Array)
    expect(context.registry.platforms).toStrictEqual(['linux/amd64', 'linux/arm/v7', 'linux/arm64'])
  })
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
