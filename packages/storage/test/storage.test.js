'use strict'

const { Connector } = require('@kookaburra/runtime')
const { Storage } = require('../src/storage')

it('should inherit runtime.Connector', () => {
  expect(Storage.prototype).toBeInstanceOf(Connector)
})

it('should provide name', () => {
  expect(Storage.name).toBe('ABSTRACT')
})

it('should provide default id implementation', () => {
  const id = Storage.id()

  expect(typeof id).toBe('string')
})

it('should provide host', () => {
  const locator = { host: (type) => `${type.toLowerCase()}.local` }
  expect(Storage.host(locator)).toBe('abstract.local')
})
