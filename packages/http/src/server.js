'use strict'

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')
const { app } = require('./app')

class Server extends Connector {
  #app

  constructor () {
    super()

    this.#app = app()
  }

  bind (runtime, operations) {

  }

  async connection () {
    const port = 3000

    await this.#app.listen(port)
    console.info(`HTTP server started at ${port}`)
  }

  async disconnection () {
    await this.#app.close()
    console.info('HTTP server stopped')
  }
}

exports.Server = Server
