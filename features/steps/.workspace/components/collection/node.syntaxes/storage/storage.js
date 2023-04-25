'use strict'

const { Connector } = require('@toa.io/core')
const { newid } = require('@toa.io/generic')

/**
 * @implements {toa.core.Storage}
 */
class Storage extends Connector {
  async get (_) {
    return { id: newid(), _version: 1 }
  }

  async store (_) {
    return true
  }

  async upsert (_, __, ___) {
    return { id: newid(), _version: 1 }
  }
}

exports.Storage = Storage
