'use strict'

const { Aspect } = require('./aspect')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  aspect (locator, declaration) {
    return new Aspect(declaration)
  }
}

exports.Factory = Factory
