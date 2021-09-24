'use strict'

const { Connector } = require('@kookaburra/core')

const resource = require('./resource')

class Producer extends Connector {
  #server
  #locator
  #endpoints
  #target

  constructor (server, locator, endpoints, target) {
    super()

    this.#server = server
    this.#locator = locator
    this.#endpoints = endpoints
    this.#target = target

    this.#bind()

    this.depends(server)
  }

  #bind () {
    this.#endpoints.map((endpoint) => this.#endpoint(endpoint))
  }

  #endpoint (endpoint) {
    const method = resource.method
    const path = resource.path(this.#locator, endpoint)

    this.#server.reply(method, path, async (request) => this.#target.invoke(endpoint, request))
  }
}

exports.Producer = Producer
