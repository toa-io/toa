'use strict'

const { Connector } = require('@kookaburra/runtime')

class Producer extends Connector {
  #transport

  constructor (transport) {
    super()

    this.#transport = transport
    this.depends(transport)
  }

  bind (runtime) {
    runtime.locator.endpoints.map((endpoint) => this.#bind(runtime, endpoint))
    this.#transport.depends(runtime)
  }

  #bind (runtime, endpoint) {
    const path = Producer.#path(runtime.locator, endpoint)

    this.#transport.reply('POST', path, async (input, query) => runtime.invoke(endpoint.name, input, query))
  }

  static #path (locator, endpoint) {
    return `/${locator.name}/${endpoint.name}`
  }
}

exports.Producer = Producer
