'use strict'

const { console } = require('@toa.io/libraries/console')
const { Connector } = require('./connector')

class Composition extends Connector {
  constructor (expositions, producers, receivers, tenants) {
    super()

    if (expositions.length > 0) this.depends(expositions)
    if (producers.length > 0) this.depends(producers)
    if (receivers.length > 0) this.depends(receivers)
    if (tenants.length > 0) this.depends(tenants)
  }

  async connection () {
    console.info('Composition complete')
  }

  async disconnected () {
    console.info('Composition shutdown complete')
  }
}

exports.Composition = Composition
