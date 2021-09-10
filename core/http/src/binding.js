'use strict'

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')

const { verb } = require('./binding/verb')
const { route } = require('./binding/route')

class Binding extends Connector {
  #server
  #keys = {}

  constructor (server) {
    super()

    this.#server = server
  }

  #bind (runtime, operation, binding) {
    const path = route(runtime.locator, operation, binding)
    const method = verb(operation)
    const key = path + method

    if (this.#keys[key]) {
      throw new Error(`Binding '${runtime.locator.endpoint(operation.name)}' ` +
        `conflicts with '${this.#keys[key].runtime.locator.endpoint(this.#keys[key].operation.name)}'`)
    }

    this.#server.bind(method, path, this.#callback(runtime, operation))
    this.#keys[key] = { runtime, operation }

    console.debug(`Bind '${runtime.locator.endpoint(operation.name)}' -> ${method} ${path}`)
  }

  #callback (runtime, operation) {
    return async (req, res) => {
      const { output, error } = await runtime.invoke(operation.name, req.body)

      res.json({ output, error })
    }
  }

  bind (runtime, operations) {
    operations.forEach(operation =>
      operation.http.forEach(binding => this.#bind(runtime, operation, binding)))
  }

  async connection () {
    await this.#server.listen()
  }

  async disconnection () {
    await this.#server.close()
  }
}

exports.Binding = Binding
