'use strict'

const { Connector } = require('@kookaburra/runtime')

const { id } = require('./id')

class Storage extends Connector {
  static name = 'Abstract'

  static async id () {
    return id()
  }

  static host (locator) {
    return locator.host(this.name)
  }
}

exports.Storage = Storage
