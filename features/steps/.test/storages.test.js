'use strict'

const { generate } = require('randomstring')
const { load } = require('../.workspace/components')

const { gherkin } = require('@toa.io/libraries/mock')
const fixtures = require('./storages.fixtures')
const mock = { gherkin, sql: fixtures.mock.sql }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('@toa.io/storages.sql', () => mock.sql)
require('../storages.js')

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

    expect(context.database).toStrictEqual(database)
    expect(context.migration).toStrictEqual(migration)
  })

  describe('Given the database has a structure for the {component} component', () => {
    const step = gherkin.steps.Gi('the database has a structure for the {component} component')

    it('should be', () => undefined)

    const database = generate()

    beforeEach(() => {
      context.database = database
      context.migration = { table: jest.fn(), database: jest.fn() }
    })

    it('should create table', async () => {
      const component = await load('sql.postgres')

      await step.call(context, component.locator.id)

      expect(context.migration.table)
        .toHaveBeenCalledWith(context.database, component.locator, component.entity.schema)
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
})
