'use strict'

const { Connector } = require('@kookaburra/core')

const { label } = require('./label')

class Consumer extends Connector {
  #channel
  #locator

  constructor (channel, locator) {
    super()

    this.#channel = channel
    this.#locator = locator

    this.depends(channel)
  }

  async request (endpoint, input, query) {
    const queue = label(this.#locator, endpoint)

    const [output, error, exception] = await this.#channel.request(queue, { input, query })

    if (exception) throw exception

    return [output, error]
  }
}

exports.Consumer = Consumer
