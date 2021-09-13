'use strict'

const { Connector } = require('@kookaburra/core')

class Producer extends Connector {
  #binding
  #runtime
  #endpoints

  constructor (bindings, runtime, endpoints) {
    super()

    if (bindings[runtime.locator.fqn]) throw new Error(`Loop binding producer '${runtime.locator.fqn}' already exists`)

    bindings[runtime.locator.fqn] = {}

    this.#binding = bindings[runtime.locator.fqn]
    this.#runtime = runtime
    this.#endpoints = endpoints
  }

  async connection () {
    this.#endpoints.forEach((endpoint) => this.#operation(endpoint))
  }

  #operation (endpoint) {
    this.#binding[endpoint] = async (input, query) => this.#runtime.invoke(endpoint, input, query)
  }
}

exports.Producer = Producer
