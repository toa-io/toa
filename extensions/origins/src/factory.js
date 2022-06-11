'use strict'

const { Context } = require('./context')
const { normalize, validate } = require('./declaration')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  contexts (declaration) {
    normalize(declaration)
    validate(declaration)

    const context = new Context(declaration)

    return [context]
  }
}

exports.Factory = Factory
