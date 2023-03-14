'use strict'

const { Connector } = require('@toa.io/core')

class Producer extends Connector {
  #binding
  #endpoints
  #producer

  constructor (bindings, locator, endpoints, producer) {
    super()

    if (bindings[locator.id] === undefined) bindings[locator.id] = {}

    this.#binding = bindings[locator.id]
    this.#endpoints = endpoints
    this.#producer = producer

    this.depends(producer)
  }

  async open () {
    this.#endpoints.forEach((endpoint) => this.#operation(endpoint))
  }

  async close () {
    this.#endpoints.forEach((endpoint) => delete this.#binding[endpoint])
  }

  #operation (endpoint) {
    if (this.#binding[endpoint] !== undefined) throw new Error(`Loop binding endpoint '${endpoint}' already exists`)

    this.#binding[endpoint] = async (request) => this.#producer.invoke(endpoint, request)
  }
}

exports.Producer = Producer
