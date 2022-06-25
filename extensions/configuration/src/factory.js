'use strict'

const { Schema } = require('@toa.io/libraries/schema')
const { Context } = require('./context')
const { Configuration } = require('./configuration')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.libraries.schema.JSON | Object} declaration
   * @return {toa.extensions.configuration.Context}
   */
  context (locator, declaration) {
    const schema = new Schema(declaration)
    const configuration = new Configuration(locator, schema)

    return new Context(configuration)
  }
}

exports.Factory = Factory
