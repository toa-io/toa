'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const { Storage } = require('../src/storage')
const { Migration } = require('../src/migration')
const { Factory } = require('../src')

/** @type {toa.sql.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

it('should be', () => {
  expect(Factory).toBeDefined()
})

it('should create storage', () => {
  const name = generate()
  const namespace = generate()
  const locator = new Locator(name, namespace)

  // use default pointer values
  process.env.TOA_DEV = '1'

  const storage = factory.storage(locator)

  delete process.env.TOA_DEV

  expect(storage).toBeDefined()
  expect(storage).toBeInstanceOf(Storage)
})

it('should create migration', () => {
  const migration = factory.migration('pg')

  expect(migration).toBeInstanceOf(Migration)
})
