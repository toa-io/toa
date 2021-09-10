'use strict'

const { console } = require('@kookaburra/gears')

const { Connector } = require('./connector')

class Composition extends Connector {
  async connection () {
    console.info('Composition complete')
  }

  async disconnection () {
    console.info('Composition shutdown complete')
  }
}

exports.Composition = Composition
