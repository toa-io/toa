'use strict'

const { Aspect } = require('./aspect')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  aspect (_, __) {
    return new Aspect()
  }
}

exports.Factory = Factory
