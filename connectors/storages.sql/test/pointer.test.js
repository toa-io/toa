'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode, letters: { up } } = require('@toa.io/libraries/generic')

const { Pointer } = require('../src/pointer')

/** @type {toa.core.Locator} */
let locator

// prevent warnings
process.env.TOA_STORAGES_SQL_DEFAULT_USERNAME = generate()
process.env.TOA_STORAGES_SQL_DEFAULT_PASSWORD = generate()

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)

  // prevent warnings
  process.env[`TOA_STORAGES_SQL_${up(locator.label)}_USERNAME`] = generate()
  process.env[`TOA_STORAGES_SQL_${up(locator.label)}_PASSWORD`] = generate()
  process.env[`TOA_STORAGES_SQL_${up(locator.namespace)}_USERNAME`] = generate()
  process.env[`TOA_STORAGES_SQL_${up(locator.namespace)}_PASSWORD`] = generate()
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

describe('resolve', () => {
  it('should resolve database, schema and table', () => {
    const database = generate()
    const schema = generate()
    const table = generate()

    annotate(locator.id, `pg://host0/${database}/${schema}/${table}`)

    const pointer = new Pointer(locator)

    expect(pointer.database).toStrictEqual(database)
    expect(pointer.schema).toStrictEqual(schema)
    expect(pointer.table).toStrictEqual(table)
  })

  it('should use locator.name as default table name', () => {
    const database = generate()
    const schema = generate()

    annotate(locator.id, `pg://host0/${database}/${schema}`)

    const pointer = new Pointer(locator)

    expect(pointer.table).toStrictEqual(locator.name)
  })

  it('should use locator.namespace as default schema name', () => {
    const database = generate()

    annotate(locator.namespace, `pg://host0/${database}`)

    const pointer = new Pointer(locator)

    expect(pointer.schema).toStrictEqual(locator.namespace)
    expect(pointer.table).toStrictEqual(locator.name)
  })

  it('should use TOA_STORAGES_SQL_DATABASE as default database name', () => {
    const database = generate()

    process.env.TOA_ENV = 'local'
    process.env.TOA_STORAGES_SQL_DATABASE = database

    const pointer = new Pointer(locator)

    delete process.env.TOA_ENV
    delete process.env.TOA_STORAGES_SQL_DATABASE

    expect(pointer.database).toStrictEqual(database)
  })

  const key = 'TOA_STORAGES_SQL_POINTER'

  const annotate = (entry, value) => {
    process.env[key] = encode({ default: 'pg://default/default', [entry]: value })
  }
})
