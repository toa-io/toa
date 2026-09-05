import { describe, it, beforeEach, mock as mocking } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'

import { knex } from './knex.mock.js'
import * as fixtures from './migration.fixtures.js'
const mock = { knex }

mocking.module('knex', { defaultExport: mock.knex })

const { Migration } = await import('../src/migration.js')

it('should be', () => {
  assert.notStrictEqual(Migration, undefined)
})

/** @type {import('../types/migration.js').Migration} */
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
  resetCalls()

  migration = new Migration(driver)
  assert.ok(knex.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { client: driver, connection })))

  sql = knex.mock.calls[0].result
  assert.notStrictEqual(sql, undefined)
})

describe('database', () => {
  it('should be', () => {
    assert.notStrictEqual(migration.database, undefined)
  })

  it('should create database', async () => {
    await migration.database(database)

    assert.ok(sql.raw.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], `create database ${database}`)))
  })

  it('should reconnect to created database', async () => {
    resetCalls()

    await migration.database(database)

    const reconnect = { ...connection, database }

    assert.ok(sql.destroy.mock.callCount() > 0)
    assert.ok(knex.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { client: driver, connection: reconnect })))
  })

  it('should not throw if already exists', async () => {
    sql.raw.mock.mockImplementationOnce(() => {
      const e = new Error()

      // https://www.postgresql.org/docs/current/errcodes-appendix.html
      e.code = '42P04'

      throw e
    })

    await assert.doesNotReject(migration.database(database))
  })
})

describe('table', () => {
  it('should be', () => {
    assert.notStrictEqual(migration.table, undefined)
  })

  /** @type {import('@toa.io/core').Locator} */
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
      '_version bigint',
      'foo bigint',
      'bar varchar'
    ]

    assert.ok(sql.raw.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], `create schema ${locator.namespace}`)))

    for (const piece of pieces) {
      assert.ok(sql.raw.mock.calls.some((call) => call.arguments.length === 1 && call.arguments[0].includes(piece)))
    }
  })

  it('should return table name', async () => {
    const output = await call()

    assert.deepStrictEqual(output, `${locator.namespace}.${locator.name}`)
  })

  it('should not throw if schema exists', async () => {
    sql.raw.mock.mockImplementationOnce(() => {
      const error = new Error()

      error.code = '42P06'

      throw error
    })

    await assert.doesNotReject(call())

    assert.ok(sql.raw.mock.calls.some((call) => call.arguments.length === 1 && call.arguments[0].includes(`create table ${locator.namespace}.${locator.name}`)))
  })

  it('should not throw if table exists', async () => {
    sql.raw.mock.mockImplementationOnce(() => null, sql.raw.mock.callCount())
    sql.raw.mock.mockImplementationOnce(() => {
      const error = new Error()

      error.code = '42P07'

      throw error
    }, sql.raw.mock.callCount() + 1)

    await assert.doesNotReject(call())
  })

  it('should reset table', async () => {
    await call(true)

    assert.ok(sql.raw.mock.calls.some((call) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], `drop table ${locator.namespace}.${locator.name}`)))
  })

  it('should not throw if reset while table or schema not exists', async () => {
    const check = async (code) => {
      sql.raw.mock.mockImplementationOnce(() => {
        const error = new Error()

        error.code = code

        throw error
      })

      await assert.doesNotReject(call(true))
    }

    await check('42P01')
    await check('3F000')
  })
})

function resetCalls (target = [assert, mock, fixtures, driver, database, connection], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
