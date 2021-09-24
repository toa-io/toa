'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./name')

class Producer extends Connector {
  #channel
  #locator
  #target
  #endpoints

  constructor (channel, locator, endpoints, target) {
    super()

    this.#channel = channel
    this.#locator = locator
    this.#endpoints = endpoints
    this.#target = target

    this.depends(channel)
  }

  async connection () {
    return Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = name(this.#locator, endpoint)

    await this.#channel.reply(queue, async (request) => this.#target.invoke(endpoint, request))
  }
}

exports.Producer = Producer
