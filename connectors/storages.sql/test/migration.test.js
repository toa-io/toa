'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const { knex } = require('./knex.mock')
const mock = { knex }

jest.mock('knex', () => mock.knex)

const fixtures = require('./migration.fixtures')
const { Migration } = require('../src/migration')

it('should be', () => {
  expect(Migration).toBeDefined()
})

/** @type {toa.core.storages.Migration} */
let migration

let sql

const driver = generate()
const database = generate()

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

beforeEach(() => {
  jest.clearAllMocks()

  migration = new Migration(driver)
  expect(knex).toHaveBeenCalledWith({ client: driver, connection })

  sql = knex.mock.results[0].value
  expect(sql).toBeDefined()
})

describe('database', () => {
  it('should be', () => {
    expect(migration.database).toBeDefined()
  })

  it('should create database', async () => {
    await migration.database(database)

    expect(sql.raw).toHaveBeenCalledWith(`create database ${database}`)
  })

  it('should reconnect to created database', async () => {
    jest.clearAllMocks()

    await migration.database(database)

    const reconnect = { ...connection, database }

    expect(sql.destroy).toHaveBeenCalled()
    expect(knex).toHaveBeenCalledWith({ client: driver, connection: reconnect })
  })

  it('should not throw if already exists', async () => {
    sql.raw.mockImplementationOnce(() => {
      const e = new Error()

      // https://www.postgresql.org/docs/current/errcodes-appendix.html
      e.code = '42P04'

      throw e
    })

    await expect(migration.database(database)).resolves.not.toThrow()
  })
})

describe('table', () => {
  it('should be', () => {
    expect(migration.table).toBeDefined()
  })

  /** @type {toa.core.Locator} */
  let locator

  const call = (reset) => migration.table(database, locator, fixtures.schema, reset)

  beforeEach(() => {
    const name = generate()
    const namespace = generate()

    locator = new Locator(name, namespace)
  })

  it('should create table', async () => {
    await call()

    const pieces = [
      `create table ${locator.namespace}.${locator.name}`,
      'id char(32) primary key',
      '_version integer',
      'foo integer',
      'bar varchar'
    ]

    expect(sql.raw).toHaveBeenCalledWith(`create schema ${locator.namespace}`)

    for (const piece of pieces) {
      expect(sql.raw).toHaveBeenCalledWith(expect.stringContaining(piece))
    }
  })

  it('should return table name', async () => {
    const output = await call()

    expect(output).toStrictEqual(`${locator.namespace}.${locator.name}`)
  })

  it('should not throw if schema exists', async () => {
    sql.raw.mockImplementationOnce(() => {
      const error = new Error()

      error.code = '42P06'

      throw error
    })

    await expect(call()).resolves.not.toThrow()

    expect(sql.raw).toHaveBeenCalledWith(
      expect.stringContaining(`create table ${locator.namespace}.${locator.name}`)
    )
  })

  it('should not throw if table exists', async () => {
    sql.raw.mockImplementationOnce(() => null)
    sql.raw.mockImplementationOnce(() => {
      const error = new Error()

      error.code = '42P07'

      throw error
    })

    await expect(call()).resolves.not.toThrow()
  })

  it('should reset table', async () => {
    await call(true)

    expect(sql.raw).toHaveBeenCalledWith(`drop table ${locator.namespace}.${locator.name}`)
  })

  it('should not throw if reset while table not exists', async () => {
    sql.raw.mockImplementationOnce(() => {
      const error = new Error()

      error.code = '42P01'

      throw error
    })

    await expect(call(true)).resolves.not.toThrow()
  })
})
