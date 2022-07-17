'use strict'

const assert = require('node:assert')
const knex = require('knex')

const { load } = require('./.workspace/components')

const { Given, Then } = require('@cucumber/cucumber')

Given('I have a {storage} database {word}',
  /**
   * @param {string} storage
   * @param {string} database
   * @this {toa.features.Context}
   */
  async function (storage, database) {
    const modules = {
      postgresql: {
        provider: '@toa.io/storages.sql',
        driver: 'pg'
      }
    }

    const id = storage.toLowerCase()
    const module = modules[id]

    if (module === undefined) throw new Error(`Storage '${storage}' is unknown`)

    const { Factory } = require(module.provider)
    const factory = new Factory()
    const migration = factory.migration(module.driver)

    await migration.database(database)

    this.storage = { database, migration, driver: module.driver }
  })

Given('the database has a structure for the {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    const component = await load(reference)

    this.storage.table = await this.storage.migration.table(
      this.storage.database, component.locator, component.entity.schema
    )
  })

Then('the table must contain rows:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} data
   * @this {toa.features.Context}
   */
  async function (data) {
    const properties = data.raw()[0]
    const client = this.storage.driver

    const connection = {
      user: 'developer',
      password: 'secret',
      database: this.storage.database
    }

    const sql = knex({ client, connection })
    const rows = data.rows()

    for (const row of rows) {
      const criteria = {}
      let i = 0

      for (const property of properties) {
        criteria[property] = row[i]
        i++
      }

      const records = await sql.from(this.storage.table).where(criteria).select('*')

      assert.equal(records.length > 0, true, `row not found ${row}`)
      assert.equal(records.length, 1, `multiple rows found ${row}`)
    }

    // sql.destroy()
  })
