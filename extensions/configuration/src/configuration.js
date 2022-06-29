'use strict'

const { Reflection } = require('@toa.io/core')

/**
 * @implements {toa.core.Reflection}
 */
class Configuration extends Reflection {
  /**
   * @param {toa.extensions.configuration.Provider} provider
   */
  constructor (provider) {
    super(provider.source)

    this.depends(provider)
  }
}

exports.Configuration = Configuration
