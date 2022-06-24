'use strict'

const { Context } = require('./context')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  context (declaration) {
    return new Context(declaration)
  }
}

exports.Factory = Factory
