'use strict'

const { Pointer: Base } = require('@toa.io/libraries/pointer')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.sql.Pointer}
 */
class Pointer extends Base {
  /**
   * @param {toa.core.Locator} locator
   */
  constructor (locator) {
    super(PREFIX, locator, OPTIONS)

    let [, database, schema, table] = this.path.split('/')

    if (schema === undefined) schema = locator.namespace
    if (table === undefined) table = locator.name

    this.database = database || process.env.TOA_STORAGES_SQL_DATABASE
    this.table = `${schema}.${table}`
  }
}

const PREFIX = 'storages-sql'

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'pg:' }

exports.Pointer = Pointer
