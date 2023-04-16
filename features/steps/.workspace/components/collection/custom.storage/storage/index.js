'use strict'

const { Connector } = require('@toa.io/core')

class Factory {
  storage () {
    return new Connector()
  }
}

exports.Factory = Factory
