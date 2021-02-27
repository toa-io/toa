'use strict'

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')
const { app } = require('./app')
const { verb } = require('./server/verb')
const { path } = require('./server/path')

class Server extends Connector {
  #server
  #app

  #port
  #keepalive

  constructor (options) {
    super()

    this.#app = app()
    this.#port = options?.port ?? 3000
    this.#keepalive = options?.keepalive ?? 60000
  }

  #bind (runtime, operation) {
    const method = verb(operation)
    const route = path(runtime.locator, operation.http?.path)

    this.#app[method.toLowerCase()](route, this.#handle(runtime, operation))

    console.debug(`Bind '${runtime.locator.name}' ${operation.state ? `${operation.state} ` : ''}${operation.type} '${operation.name}' -> ${method} ${route}`)
  }

  #handle (runtime, operation) {
    return async (req, res) => {
      const { output, error } = await runtime.invoke(operation.name, req.body)

      res.json({ output, error })
    }
  }

  bind (runtime, operations) {
    Object.entries(operations).forEach(([, operation]) => this.#bind(runtime, operation))
  }

  async connection () {
    return new Promise(resolve => {
      console.debug(`Starting HTTP server at ${this.#port}...`)

      this.#server = this.#app.listen(this.#port, () => {
        console.info(`HTTP server started at ${this.#port}`)
        resolve()
      })

      this.#server.keepAliveTimeout = this.#keepalive
      this.#server.on('connection', (socket) => socket.setTimeout(this.#keepalive || 10))
    })
  }

  async disconnection () {
    return new Promise(resolve => {
      console.debug('Stopping http server...')

      this.#server.close(() => {
        console.info('HTTP server stopped')
        resolve()
      })
    })
  }
}

exports.Server = Server
