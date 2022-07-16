'use strict'

const { load } = require('./.workspace/components')

const { Given } = require('@cucumber/cucumber')

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

    this.database = database
    this.migration = migration
  })

Given('the database has a structure for the {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    const component = await load(reference)

    await this.migration.table(this.database, component.locator, component.entity.schema)
  })
