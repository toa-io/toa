'use strict'

it('should export yaml', () => {
  const { load } = require('@toa.io/libraries/yaml')

  expect(load).toBeInstanceOf(Function)
})

it('should export schema', () => {
  const { Schema } = require('@toa.io/libraries/schema')

  expect(Schema).toBeInstanceOf(Function)
})

it('should export console', () => {
  const { console } = require('@toa.io/libraries/console')

  expect(console).toBeDefined()
})

it('should export annotations', () => {
  const { proxy } = require('@toa.io/libraries/annotations')

  expect(proxy).toBeInstanceOf(Function)
})

it('should export generic', () => {
  const { retry } = require('@toa.io/libraries/generic')

  expect(retry).toBeInstanceOf(Function)
})
