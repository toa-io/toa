'use strict'

const { Storage } = require('./storage')

/**
 * @implements {toa.core.storages.Factory}
 */
class Factory {
  storage (_) {
    return new Storage()
  }
}

exports.Factory = Factory
