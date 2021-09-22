'use strict'

const { Connector } = require('@kookaburra/core')

const { label } = require('./label')

class Producer extends Connector {
  #channel
  #runtime
  #endpoints

  emitter = true

  constructor (channel, runtime, endpoints) {
    super()

    this.#channel = channel
    this.#runtime = runtime
    this.#endpoints = endpoints

    this.depends(channel)
  }

  async connection () {
    await Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async emit (name, payload) {
    const queue = label(this.#runtime.locator, name)

    await this.#channel.event(queue, payload)
  }

  async #endpoint (endpoint) {
    const queue = label(this.#runtime.locator, endpoint)

    await this.#channel.reply(queue, async (request) => this.#runtime.invoke(endpoint, request))
  }
}

exports.Producer = Producer
