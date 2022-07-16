'use strict'

const { Given } = require('@cucumber/cucumber')

Given('I have a {word} database {word}',
  /**
   * @param {string} connector
   * @param {string} database
   * @this {toa.features.Context}
   */
  async function (connector, database) {
    const modules = {
      sql: '@toa.io/storages.sql'
    }

    const id = connector.toLowerCase()
    const module = modules[id]

    if (module === undefined) throw new Error(`Storage '${connector}' is unknown`)

    const { Factory } = require(module)
    const factory = new Factory()
    const migration = factory.migration()

    await migration.database(database)
  })
