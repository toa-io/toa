'use strict'

const { Schema } = require('@toa.io/schema')
const { Aspect } = require('./aspect')
const { Configuration } = require('./configuration')
const { Provider } = require('./provider')

/**
 * @implements {toa.extensions.configuration.Factory}
 */
class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.schema.JSON | Object} annotation
   * @return {toa.extensions.configuration.Aspect}
   */
  aspect (locator, annotation) {
    const schema = new Schema(annotation)
    const provider = new Provider(locator, schema)
    const configuration = new Configuration(provider)

    return new Aspect(configuration)
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
