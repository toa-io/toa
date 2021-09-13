'use strict'

const { Connector } = require('@kookaburra/core')

const { label } = require('./label')

class Producer extends Connector {
  #channel
  #runtime
  #endpoints

  constructor (channel, runtime, endpoints) {
    super()

    this.#channel = channel
    this.#runtime = runtime
    this.#endpoints = endpoints

    this.depends(channel)
    this.depends(runtime)
  }

  async connection () {
    await Promise.all(this.#endpoints.map((endpoint) => this.#operation(endpoint)))
  }

  async #operation (endpoint) {
    const queue = label(this.#runtime.locator, endpoint)

    await this.#channel.reply(queue, async ({ input, query }) => this.#invoke(endpoint, input, query))
  }

  async #invoke (endpoint, input, query) {
    let output, error, exception

    try {
      [output, error] = await this.#runtime.invoke(endpoint, input, query)
    } catch ({ message, stack }) {
      exception = { message }

      if (process.env.KOO_ENV === 'dev') exception.stack = stack
    }

    return [output, error, exception]
  }
}

exports.Producer = Producer
