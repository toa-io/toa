'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  connector (locator, declaration) {
    return new Connector()
  }
}

exports.Factory = Factory
