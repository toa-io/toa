'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { encode } = require('@toa.io/libraries/generic')
const { Pointer } = require('../src/pointer')

const fixtures = require('./connection.fixtures')
const mock = fixtures.mock
const knex = mock.knex

jest.mock('knex', () => mock.knex)

const { Connection } = require('../src/connection')

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

beforeEach(() => {
  const name = generate()
  const namespace = generate()

  process.env.TOA_STORAGES_SQL_POINTER = encode(annotation)
  process.env.TOA_STORAGES_SQL_DEFAULT_USERNAME = username
  process.env.TOA_STORAGES_SQL_DEFAULT_PASSWORD = password

  locator = new Locator(name, namespace)
  pointer = new Pointer(locator)
  connection = new Connection(pointer)
})

it('should be', () => {
  expect(Connection).toBeDefined()
})

describe('connection', () => {
  beforeEach(async () => {
    await connection.connect()
  })

  it('should configure', () => {
    expect(knex).toHaveBeenCalled()

    /** @type {import('knex').Knex.Config} */
    const config = knex.mock.calls[0][0]

    // driver
    expect(config.client).toStrictEqual('pg')

    // connection
    const connection = /** @type {import('knex').Knex.PgConnectionConfig} */ config.connection

    expect(connection).toBeDefined()
    expect(connection.host).toStrictEqual(locator.hostname(prefix))
    expect(connection.port).toStrictEqual(Number(url.port))
    expect(connection.user).toStrictEqual(username)
    expect(connection.password).toStrictEqual(password)
    expect(connection.database).toStrictEqual(database)
  })

  it('should run connection query', () => {
    const query = knex.mock.results[0].value

    expect(query.select).toHaveBeenCalledWith('1')
  })
})
