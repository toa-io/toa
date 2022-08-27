'use strict'

const { Annex } = require('./annex')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  annex (locator, declaration) {
    return new Annex(declaration)
  }
}

exports.Factory = Factory
