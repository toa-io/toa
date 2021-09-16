'use strict'

const { Connector } = require('./connector')

class Discovery extends Connector {
  #transmission

  constructor (transmission) {
    super()

    this.#transmission = transmission

    this.depends(transmission)
  }

  async discover () {
    const { output } = await this.#transmission.request()

    return output
  }
}

exports.Discovery = Discovery
