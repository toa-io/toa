'use strict'

const { Schema } = require('@toa.io/libraries/schema')
const { Annex } = require('./annex')
const { Configuration } = require('./configuration')
const { Provider } = require('./provider')

/**
 * @implements {toa.extensions.configuration.Factory}
 */
class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.schema.JSON | Object} declaration
   * @return {toa.extensions.configuration.Annex}
   */
  annex (locator, declaration) {
    const schema = new Schema(declaration)
    const provider = new Provider(locator, schema)
    const configuration = new Configuration(provider)

    return new Annex(configuration)
  }

  provider (component) {
    const locator = component.locator
    const declaration = component.extensions?.[ID]

    if (declaration === undefined) throw new Error(`Configuration extension not found in '${locator.id}'`)

    const schema = new Schema(declaration)

    return new Provider(locator, schema)
  }
}

const ID = require('../package.json').name

exports.Factory = Factory
