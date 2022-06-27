'use strict'

const { generate } = require('randomstring')
const core = require('@toa.io/core')

const { Locator } = require('../src/locator')

it('should set locator.host', () => {
  const env = process.env.TOA_ENV

  delete process.env.TOA_ENV

  const original = new core.Locator({ namespace: generate(), name: generate() })
  const locator = new Locator(original)

  expect(locator.hostname).toStrictEqual(original.host('storages-mongodb'))

  process.env.TOA_ENV = env
})

it('should set localhost if env=local', () => {
  const env = process.env.TOA_ENV

  process.env.TOA_ENV = 'local'

  const original = new core.Locator({ namespace: generate(), name: generate() })
  const locator = new Locator(original)

  expect(locator.hostname).toStrictEqual('localhost')

  process.env.TOA_ENV = env
})
