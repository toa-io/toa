'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/libraries/generic')
const { Pointer } = require('../src/pointer')

const { knex } = require('./knex.mock')
const mock = { knex }

jest.mock('knex', () => mock.knex)

const { Connection } = require('../src/connection')

it('should be', () => {
  expect(Connection).toBeDefined()
})

const username = generate()
const password = generate()
const database = generate()

/** @type {URL} */
const url = new URL(`pg://host0:5432/${database}`)

/** @type {toa.pointer.URIs} */
const annotation = { default: url.href }

/** @type {toa.core.Locator} */
let locator

/** @type {toa.sql.Pointer} */
let pointer

/** @type {toa.sql.Connection} */
let connection

/** @type {import('knex').Knex} */
let client

beforeAll(async () => {
  process.env.TOA_STORAGES_SQL_POINTER = encode(annotation)
  process.env.TOA_STORAGES_SQL_DEFAULT_USERNAME = username
  process.env.TOA_STORAGES_SQL_DEFAULT_PASSWORD = password
})

beforeEach(async () => {
  jest.clearAllMocks()

  const name = generate()
  const namespace = generate()

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
  connection = new Connection(pointer)

  await connection.connect()

  expect(knex).toHaveBeenCalled()

  client = knex.mock.results[0].value
})

afterEach(async () => {
  await connection.disconnect()
})

describe('connection', () => {
  it('should configure', () => {
    /** @type {import('knex').Knex.Config} */
    const config = knex.mock.calls[0][0]

    // driver
    expect(config.client).toStrictEqual('pg')

    // connection
    const connection = /** @type {import('knex').Knex.PgConnectionConfig} */ config.connection

    expect(connection).toBeDefined()
    expect(connection.host).toStrictEqual(pointer.hostname)
    expect(connection.port).toStrictEqual(Number(url.port))
    expect(connection.user).toStrictEqual(username)
    expect(connection.password).toStrictEqual(password)
    expect(connection.database).toStrictEqual(database)

    // https://github.com/knex/knex/issues/3523
    expect(config.pool.min).toStrictEqual(0)
  })

  it('should run connection query', () => {
    expect(client.raw).toHaveBeenCalledWith('select 1')
  })

  it('should disconnect', async () => {
    await connection.disconnect()

    expect(client.destroy).toHaveBeenCalled()
  })

  it('should share connection', async () => {
    expect(knex).toHaveBeenCalledTimes(1)

    // new Locator leads to different schema and table within
    // the same database connection
    const name = generate()
    const namespace = generate()
    const locator = new Locator(name, namespace)
    const pointer = new Pointer(locator)
    const instance = new Connection(pointer)

    await instance.connect()

    expect(knex).toHaveBeenCalledTimes(1)
  })

  it('should share connection with specific annotations', async () => {
    jest.clearAllMocks()

    const annotation = {
      'dummies.one': 'pg://host0/db/sch1/tbl1',
      'dummies.two': 'pg://host0/db/sch2/tbl2'
    }

    const env = process.env.TOA_STORAGES_SQL_POINTER

    process.env.TOA_STORAGES_SQL_POINTER = encode(annotation)
    process.env.TOA_STORAGES_SQL_DUMMIES_ONE_USERNAME = username
    process.env.TOA_STORAGES_SQL_DUMMIES_TWO_USERNAME = username
    process.env.TOA_STORAGES_SQL_DUMMIES_ONE_PASSWORD = password
    process.env.TOA_STORAGES_SQL_DUMMIES_TWO_PASSWORD = username

    const connect = async (name, namespace) => {
      const locator = new Locator(name, namespace)
      const pointer = new Pointer(locator)
      const connection = new Connection(pointer)

      await connection.connect()

      return connection
    }

    connect('one', 'dummies').then()
    connect('two', 'dummies').then()

    expect(knex).toHaveBeenCalledTimes(1)

    process.env.TOA_STORAGES_SQL_POINTER = env
  })
})

describe('insert', () => {
  it('should be', () => {
    expect(connection.insert).toBeDefined()
  })

  it('should insert', async () => {
    const table = generate()
    const entity = generate()

    await connection.insert(table, entity)

    expect(client.insert).toHaveBeenCalledWith(entity)
    expect(client.into).toHaveBeenCalledWith(table)
  })

  it('should return true', async () => {
    const output = await connection.insert({ id: generate(), _version: 0 })

    expect(output).toStrictEqual(true)
  })
})
