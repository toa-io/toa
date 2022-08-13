'use strict'

/**
 * @implements {toa.schema.Schema}
 */
class Schema {
  schema

  constructor (schema) {
    this.schema = typeof schema === 'object' ? schema : { type: schema }
  }
}

exports.mock = { Schema }
