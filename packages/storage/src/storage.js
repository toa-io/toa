'use strict'

const { Connector } = require('@kookaburra/runtime')

const { id } = require('./id')

class Storage extends Connector {
  static name = 'Abstract'

  static async id () {
    return id()
  }
}

exports.Storage = Storage
