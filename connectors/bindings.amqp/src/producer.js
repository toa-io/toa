'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./queue')

class Producer extends Connector {
  #channel
  #locator
  #producer
  #endpoints

  constructor (channel, locator, endpoints, producer) {
    super()

    this.#channel = channel
    this.#locator = locator
    this.#endpoints = endpoints
    this.#producer = producer

    this.depends(channel)
    this.depends(producer)
  }

  async connection () {
    return Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = name(this.#locator, endpoint)

    await this.#channel.reply(queue, async (request) => this.#producer.invoke(endpoint, request))
  }
}

exports.Producer = Producer
