'use strict'

const { console } = require('@toa.io/gears')

const { Connector } = require('./connector')

class Composition extends Connector {
  constructor (discovery, expositions, producers, receivers, extensions) {
    super()

    this.depends(discovery)
    this.depends(expositions)
    this.depends(producers)
    this.depends(receivers)
    this.depends(extensions)
  }

  async connection () {
    console.info('Composition complete')
  }

  async disconnected () {
    console.info('Composition shutdown complete')
  }
}

exports.Composition = Composition
