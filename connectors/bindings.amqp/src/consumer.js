'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./queue')

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
