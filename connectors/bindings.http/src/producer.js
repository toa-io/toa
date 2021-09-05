'use strict'

const { Connector } = require('@kookaburra/runtime')

class Producer extends Connector {
  #server

  constructor (server, runtime) {
    super()

    this.#server = server
    this.depends(server)
    this.#bind(runtime)

    server.depends(runtime)
  }

  #bind (runtime) {
    runtime.locator.endpoints.map((endpoint) => this.#endpoint(runtime, endpoint))
  }

  #endpoint (runtime, endpoint) {
    const path = Producer.#path(runtime.locator, endpoint)

    this.#server.reply('POST', path, async (input, query) => runtime.invoke(endpoint.name, input, query))
  }

  static #path (locator, endpoint) {
    return `/${locator.name}/${endpoint.name}`
  }
}

exports.Producer = Producer
