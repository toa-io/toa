'use strict'

const { Connector } = require('@kookaburra/core')

const resource = require('./resource')

class Producer extends Connector {
  #server
  #runtime

  constructor (server, runtime, endpoints) {
    super()

    this.#server = server
    this.#runtime = runtime

    this.#bind(runtime, endpoints)

    this.depends(server)
    server.depends(runtime)
  }

  #bind (runtime, endpoints) {
    endpoints.map((endpoint) => this.#endpoint(runtime, endpoint))
  }

  #endpoint (runtime, endpoint) {
    const method = resource.method
    const path = resource.path(runtime.locator, endpoint)

    this.#server.reply(method, path, async (request) => this.#runtime.invoke(endpoint, request))
  }
}

exports.Producer = Producer
