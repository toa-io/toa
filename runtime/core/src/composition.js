'use strict'

const { console } = require('@toa.io/gears')

const { Connector } = require('./connector')

class Composition extends Connector {
  constructor (expositions, producers, receivers, extensions) {
    super()

    if (expositions.length > 0) this.depends(expositions)
    if (producers.length > 0) this.depends(producers)
    if (receivers.length > 0) this.depends(receivers)
    if (extensions.length > 0) this.depends(extensions)
  }

  async connection () {
    console.info('Composition complete')
  }

  async disconnected () {
    console.info('Composition shutdown complete')
  }
}

exports.Composition = Composition
