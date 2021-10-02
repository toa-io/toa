'use strict'

const { Connector } = require('@kookaburra/core')

const resource = require('./resource')

class Producer extends Connector {
  #server
  #locator
  #endpoints
  #producer

  constructor (server, locator, endpoints, producer) {
    super()

    this.#server = server
    this.#locator = locator
    this.#endpoints = endpoints
    this.#producer = producer

    this.#bind()

    this.depends(server)
    this.depends(producer)
  }

  #bind () {
    this.#endpoints.map((endpoint) => this.#endpoint(endpoint))
  }

  #endpoint (endpoint) {
    const method = resource.method
    const path = resource.path(this.#locator, endpoint)

    this.#server.reply(method, path, async (request) => this.#producer.invoke(endpoint, request))
  }
}

exports.Producer = Producer
