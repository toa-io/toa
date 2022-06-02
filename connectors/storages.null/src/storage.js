'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.storages.Storage}
 */
class Storage extends Connector {
  async get (_) {
    return null
  }

  async add (_) {
    return true
  }

  async store (_) {
    return true
  }
}

exports.Storage = Storage
