'use strict'

const { Connector } = require('@kookaburra/runtime')

class Server extends Connector {
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
    const path = Server.#path(runtime.locator, endpoint)

    this.#transport.reply('POST', path, (input, query) => runtime.invoke(endpoint.name, input, query))
  }

  static #path (locator, endpoint) {
    return `/${locator.name}/${endpoint.name}`
  }
}

exports.Server = Server
