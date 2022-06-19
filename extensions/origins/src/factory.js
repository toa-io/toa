'use strict'

const { Context } = require('./context')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  contexts (declaration) {
    const context = new Context(declaration)

    return [context]
  }
}

exports.Factory = Factory
