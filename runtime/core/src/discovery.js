'use strict'

const { Connector } = require('./connector')

class Discovery extends Connector {
  #transmitter

  constructor (transmitter) {
    super()

    this.#transmitter = transmitter

    this.depends(transmitter)
  }

  async lookup (fqn) {
    const { output } = await this.#transmitter.request(fqn + '.lookup')

    return output
  }
}

exports.Discovery = Discovery
