'use strict'

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')

const { verb } = require('./binding/verb')
const { route } = require('./binding/route')

class Binding extends Connector {
  #server

  constructor (server) {
    super()

    this.#server = server
  }

  #bind (runtime, operation) {
    const method = verb(operation)
    const path = route(runtime.locator)

    this.#server.bind(method, path, this.#callback(runtime, operation))

    console.debug(`Bind '${runtime.locator.name}' ${operation.state ? `${operation.state} ` : ''}` +
      `${operation.type} '${operation.name}' -> ${method} ${path}`)
  }

  #callback (runtime, operation) {
    return async (req, res) => {
      const { output, error } = await runtime.invoke(operation.name, req.body)

      res.json({ output, error })
    }
  }

  bind (runtime, operations) {
    Object.entries(operations).forEach(([, operation]) => this.#bind(runtime, operation))
  }

  async connection () {
    await this.#server.listen()
  }

  async disconnection () {
    await this.#server.close()
  }
}

exports.Binding = Binding
