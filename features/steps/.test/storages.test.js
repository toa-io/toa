'use strict'

const { AssertionError } = require('assert')
const { generate } = require('randomstring')
const { load } = require('../.workspace/components')

const { knex } = require('@toa.io/storages.sql/test/knex.mock')
const { gherkin } = require('@toa.io/libraries/mock')
const fixtures = require('./storages.fixtures')
const mock = { gherkin, sql: fixtures.mock.sql, knex }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/storages.sql', () => mock.sql)
jest.mock('knex', () => mock.knex)

require('../storages.js')
const { random } = require('../../../libraries/generic')

it('should be', () => undefined)

/** @type {toa.features.Context} */
let context

beforeEach(() => {
  jest.clearAllMocks()

  context = {}
})

describe('Given I have a {storage} database {word}', () => {
  const step = gherkin.steps.Gi('I have a {storage} database {word}')

  it('should be', () => undefined)

  it('should throw if unknown storage', async () => {
    await expect(step.call(context, 'nope', 'any')).rejects.toThrow('Storage \'nope\' is unknown')
  })

  it('should resolve case insensitive', async () => {
    await step.call(context, 'postgresql', 'any')

    used()
  })

  it('should create database', async () => {
    const database = generate()

    await step.call(context, 'PostgreSQL', database)

    const migration = used('pg')

    expect(migration.database).toHaveBeenCalledWith(database)
  })

  it('should set database and storage in context', async () => {
    const database = generate()

    await step.call(context, 'PostgreSQL', database)

    const migration = used()

    expect(context.storage.driver).toStrictEqual('pg')
    expect(context.storage.database).toStrictEqual(database)
    expect(context.storage.migration).toStrictEqual(migration)
  })

})

describe('Given the database has a structure for the {component} component', () => {
  const step = gherkin.steps.Gi('the database has a structure for the {component} component')

  it('should be', () => undefined)

  const database = generate()
  const table = generate()

  const migration = /** @type {toa.core.storages.Migration} */ {
    table: jest.fn(() => table),
    database: jest.fn(),
    disconnect: jest.fn()
  }

  let component

  beforeAll(async () => {
    component = await load('sql.one')
  })

  beforeEach(() => {
    context.storage = { driver: generate(), database, migration }
  })

  it('should create table', async () => {
    await step.call(context, component.locator.id)

    expect(context.storage.migration.table).toHaveBeenCalledWith(
      context.storage.database, component.locator, component.entity.schema, true
    )
  })

  it('should update set table in context', async () => {
    const locator = component.locator

    await step.call(context, locator.id)

    expect(context.storage.table).toStrictEqual(table)
  })
})

describe('Then the table must contain rows:', () => {
  const step = gherkin.steps.Th('the table must contain rows:')

  it('should be', () => undefined)

  /** @type {toa.mock.gherkin.Table} */
  let data

  /** @type {toa.features.Context} */
  let context

  beforeEach(() => {
    const rows = [['foo', 'bar']]

    for (let i = 0; i < random(3) + 1; i++) rows.push([generate(), generate()])

    data = gherkin.table(rows)

    /** @type {toa.features.context.Storage} */
    const storage = { driver: generate(), database: generate(), table: generate() }

    context = { storage }
  })

  it('should find rows', async () => {
    knex.result([{}])

    await step.call(context, data)

    const rows = data.rows()
    const client = context.storage.driver
    const connection = {
      user: 'developer',
      password: 'secret',
      database: context.storage.database
    }

    const config = { client, connection }

    expect(knex).toHaveBeenCalledWith(config)

    const sql = knex.mock.results[0].value

    expect(rows.length > 0).toStrictEqual(true)
    expect(sql.from).toHaveBeenCalledWith(context.storage.table)
    expect(sql.from).toHaveBeenCalledTimes(rows.length)
    expect(sql.select).toHaveBeenCalledTimes(rows.length)
    expect(sql.destroy).toHaveBeenCalled()

    for (const row of rows) {
      expect(sql.where).toHaveBeenCalledWith({ foo: row[0], bar: row[1] })
    }
  })

  it('should pass if found', async () => {
    knex.result([{}])

    await step.call(context, data)
  })

  it('should fail if not found', async () => {
    knex.result([])

    await expect(step.call(context, data)).rejects.toThrow(AssertionError)
  })

  it('should fail if multiple found', async () => {
    knex.result([{}, {}])

    await expect(step.call(context, data)).rejects.toThrow(AssertionError)
  })
})

/**
 * @param {string} [driver]
 * @returns {toa.core.storages.Migration}
 */
const used = (driver = undefined) => {
  expect(mock.sql.Factory).toHaveBeenCalledWith()

  const factory = mock.sql.Factory.mock.results[0].value

  expect(factory).toBeDefined()
  expect(factory.migration).toHaveBeenCalled()

  if (driver !== undefined) expect(factory.migration).toHaveBeenCalledWith(driver)

  const migration = factory.migration.mock.results[0].value

  expect(migration).toBeDefined()

  return migration
}
