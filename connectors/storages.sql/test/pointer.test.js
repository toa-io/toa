'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/libraries/generic')

const { Pointer } = require('../src/pointer')

/** @type {toa.core.Locator} */
let locator

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)
})

it('should be', () => {
  expect(Pointer).toBeDefined()
})

it('should define package prefix', () => {
  const key = 'TOA_STORAGES_SQL_POINTER'
  const annotation = { default: 'mysql://host0' }

  process.env[key] = encode(annotation)

  const pointer = new Pointer(locator)

  expect(pointer.protocol).toStrictEqual('mysql:')
})

it('should define protocol for local environment', () => {
  process.env.TOA_ENV = 'local'

  const pointer = new Pointer(locator)

  expect(pointer.protocol).toStrictEqual('pg:')

  delete process.env.TOA_ENV
})
