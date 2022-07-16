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

    const [, database, schema, table] = this.path.split('/')

    this.database = database || process.env.TOA_STORAGES_SQL_DATABASE
    this.schema = schema || locator.namespace
    this.table = table || locator.name
  }
}

const PREFIX = 'storages-sql'

/** @type {toa.pointer.Options} */
const OPTIONS = { protocol: 'pg:' }

exports.Pointer = Pointer
