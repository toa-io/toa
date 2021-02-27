'use strict'

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')
const { app } = require('./app')
const { verb } = require('./server/verb')
const { path } = require('./server/path')

class Server extends Connector {
  #app
  #port

  constructor (options) {
    super()

    this.#app = app()
    this.#port = options?.port || 3000
  }

  #bind (runtime, operation) {
    const method = verb(operation)
    const rel = path(runtime.locator, operation.http?.path)

    console.debug(`Bind ${operation.state} ${operation.type} '${operation.name}' -> ${method} ${rel}`)
  }

  bind (runtime, operations) {
    Object.entries(operations).forEach(([, operation]) => Server.bind(runtime, operation))
  }

  async connection () {
    await this.#app.listen(this.#port)
    console.info(`HTTP server started at ${this.#port}`)
  }

  async disconnection () {
    await this.#app.close()
    console.info('HTTP server stopped')
  }
}

exports.Server = Server
