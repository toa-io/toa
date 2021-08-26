'use strict'

const { Connector } = require('@kookaburra/runtime')

const { id } = require('./id')

class Storage extends Connector {
  static name = 'ABSTRACT'

  static id () {
    return id()
  }

  static host (locator) {
    return locator.host(Storage.name)
  }
}

exports.Storage = Storage
