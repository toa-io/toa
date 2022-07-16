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

const prefix = 'storages-sql'
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

describe('connection', () => {
  it('should configure', () => {
    /** @type {import('knex').Knex.Config} */
    const config = knex.mock.calls[0][0]

    // driver
    expect(config.client).toStrictEqual('pg')

    // connection
    const connection = /** @type {import('knex').Knex.PgConnectionConfig} */ config.connection
    const hostname = locator.hostname(prefix)

    expect(connection).toBeDefined()
    expect(connection.host).toStrictEqual(hostname)
    expect(connection.port).toStrictEqual(Number(url.port))
    expect(connection.user).toStrictEqual(username)
    expect(connection.password).toStrictEqual(password)
    expect(connection.database).toStrictEqual(database)
  })

  it('should run connection query', () => {
    expect(client.raw).toHaveBeenCalledWith('select 1')
  })

  it('should disconnect', async () => {
    await connection.disconnect()

    expect(client.destroy).toHaveBeenCalled()
  })
})

describe('insert', () => {
  it('should be', () => {
    expect(connection.insert).toBeDefined()
  })

  it('should call knex insert', async () => {
    const entity = generate()

    await connection.insert(entity)

    expect(client.insert).toHaveBeenCalled()
  })
})
