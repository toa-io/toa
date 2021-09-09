'use strict'

const { Connector } = require('../connector')

class Discovery extends Connector {
  #consumer

  constructor (consumer) {
    super()

    this.#consumer = consumer

    this.depends(consumer)
  }

  async discover () {
    const [output] = await this.#consumer.request('discover')

    return output
  }
}

exports.Discovery = Discovery
