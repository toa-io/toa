'use strict'

const { Context } = require('./context')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  context (locator, declaration) {
    return new Context(declaration)
  }
}

exports.Factory = Factory
