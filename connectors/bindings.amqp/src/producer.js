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
    await Promise.all(this.#runtime.locator.endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = label(this.#runtime.locator, endpoint)

    this.#channel.reply(queue, async ({ input, query }) => {
      let output, error, exception

      try {
        [output, error] = await this.#runtime.invoke(endpoint.name, input, query)
      } catch ({ code, message, stack }) {
        exception = { code, message }

        if (process.env.KOO_ENV === 'dev') exception.stack = stack
      }

      return [output, error, exception]
    })
  }
}

exports.Producer = Producer
