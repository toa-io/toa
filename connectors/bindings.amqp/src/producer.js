'use strict'

const { Connector } = require('@toa.io/core')

const { name } = require('./queue')

class Producer extends Connector {
  #channel
  /** @type {toa.core.Locator} */
  #locator
  /** @type {toa.core.Component} */
  #producer
  /** @type {Array<string>} */
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
    await Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = name(this.#locator, endpoint)
    await this.#channel.reply(queue, async (request) => this.#producer.invoke(endpoint, request))
  }
}

exports.Producer = Producer
