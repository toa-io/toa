'use strict'

const { Reflection } = require('@toa.io/core')
const { source } = require('./.configuration/source')

/**
 * @implements {toa.core.Reflection}
 */
class Configuration extends Reflection {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.libraries.schema.Schema} schema
   */
  constructor (locator, schema) {
    super(source(locator, schema))
  }
}

exports.Configuration = Configuration
