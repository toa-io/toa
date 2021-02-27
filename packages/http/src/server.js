'use strict'

const destroyable = require('server-destroy')

const { console } = require('@kookaburra/gears')

const { app } = require('./app')

class Server {
  #app
  #instance

  #port
  #tentative

  constructor (options) {
    this.#app = app()

    this.#port = options?.port ?? 3000
    this.#tentative = options.tentative
  }

  bind (method, route, callback) {
    this.#app[method.toLowerCase()](route, callback)
  }

  async listen () {
    return new Promise(resolve => {
      console.debug(`Starting ${this.#tentative && 'tentative '}HTTP server at ${this.#port}...`)

      this.#instance = this.#app.listen(this.#port, () => {
        console.info(`HTTP server started at ${this.#port}`)
        resolve()
      })

      if (this.#tentative) { destroyable(this.#instance) }
    })
  }

  async close () {
    return new Promise(resolve => {
      console.debug('Stopping http server...')

      this.#instance.close(() => {
        console.info('HTTP server stopped')
        resolve()
      })

      if (this.#tentative) {
        this.#instance.destroy()
      }
    })
  }
}

exports.Server = Server
