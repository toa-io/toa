'use strict'

const { Schema } = require('@toa.io/libraries/schema')
const { Context } = require('./context')
const { Configuration } = require('./configuration')
const { Provider } = require('./provider')

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
    const provider = new Provider(locator, schema)
    const configuration = new Configuration(provider)

    return new Context(configuration)
  }

  configuration () {

  }
}

exports.Factory = Factory
