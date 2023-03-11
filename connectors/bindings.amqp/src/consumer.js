'use strict'

const { Connector } = require('@toa.io/core')

const { name } = require('./queue')

/**
 * @implements {toa.core.bindings.Consumer}
 */
class Consumer extends Connector {
  #channel
  #queue

  constructor (channel, locator, endpoint) {
    super()

    this.#channel = channel
    this.#queue = name(locator, endpoint)

    this.depends(channel)
  }

  async request (request) {
    return this.#channel.request(this.#queue, request)
  }
}

exports.Consumer = Consumer
