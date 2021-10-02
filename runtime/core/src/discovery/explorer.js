'use strict'

const { Connector } = require('../connector')

class Explorer extends Connector {
  #transmitters

  constructor (transmitters) {
    super()

    this.#transmitters = transmitters

    this.#depends()
  }

  async lookup () {
    const { output } = await this.#transmitters.lookup.request()

    return output
  }

  #depends () {
    for (const transmitter of Object.values(this.#transmitters)) {
      this.depends(transmitter)
    }
  }
}

exports.Explorer = Explorer
