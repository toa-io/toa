'use strict'

const { Connector } = require('@kookaburra/core')

class Producer extends Connector {
  #binding
  #endpoints
  #producer

  constructor (bindings, locator, endpoints, producer) {
    super()

    if (bindings[locator.fqn] === undefined) bindings[locator.fqn] = {}

    this.#binding = bindings[locator.fqn]
    this.#endpoints = endpoints
    this.#producer = producer
  }

  async connection () {
    this.#endpoints.forEach((endpoint) => this.#operation(endpoint))
  }

  #operation (endpoint) {
    if (this.#binding[endpoint] !== undefined) throw new Error(`Loop binding endpoint '${endpoint}' already exists`)

    this.#binding[endpoint] = async (request) => this.#producer.invoke(endpoint, request)
  }
}

exports.Producer = Producer
