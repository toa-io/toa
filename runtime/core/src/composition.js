'use strict'

const { console } = require('@kookaburra/gears')

const { Connector } = require('./connector')

class Composition extends Connector {
  constructor (expositions, bindings) {
    super()

    this.depends(expositions)
    this.depends(bindings)
  }

  async connection () {
    console.info('Composition complete')
  }

  async disconnected () {
    console.info('Composition shutdown complete')
  }
}

exports.Composition = Composition
