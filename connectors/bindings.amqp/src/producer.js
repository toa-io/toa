'use strict'

const { Connector } = require('@kookaburra/runtime')

const { label } = require('./label')

class Producer extends Connector {
  #channel
  #runtime

  constructor (channel, runtime) {
    super()

    this.#channel = channel
    this.#runtime = runtime

    this.depends(channel)
    this.depends(runtime)
  }

  async connection () {
    await Promise.all(this.#runtime.locator.endpoints.map((endpoint) => this.#operation(endpoint.name)))
  }

  async #operation (operation) {
    const queue = label(this.#runtime.locator, operation)

    await this.#channel.reply(queue, async ({ input, query }) => this.#invoke(operation, input, query))
  }

  async #invoke (operation, input, query) {
    let output, error, exception

    try {
      [output, error] = await this.#runtime.invoke(operation, input, query)
    } catch ({ code, message, stack }) {
      exception = { code, message }

      if (process.env.KOO_ENV === 'dev') exception.stack = stack
    }

    return [output, error, exception]
  }
}

exports.Producer = Producer
