'use strict'

const express = require('express')

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')

class Transport extends Connector {
  #app
  #server
  #options = {}

  constructor () {
    super()

    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.use(express.json())

    this.#options.port = 3000
  }

  reply (verb, route, invocation) {
    console.debug(`Binding ${verb} ${route}`)
    this.#app[verb.toLowerCase()](route, async (req, res) => res.json(await invocation(req.body.input, req.body.query)))
  }

  async connection () {
    return new Promise((resolve, reject) => {
      console.debug(`Starting HTTP server at ${this.#options.port}`)

      this.#server = this.#app.listen(this.#options.port, () => {
        console.info(`HTTP server started at :${this.#options.port}`)

        this.#server.off('error', reject)
        resolve()
      })

      this.#server.on('error', reject)
    })
  }

  async disconnection () {
    return new Promise((resolve, reject) => {
      console.debug('Stopping http server...')

      this.#server.close(() => {
        console.info('HTTP server stopped')

        this.#server.off('error', reject)
        resolve()
      })

      this.#server.on('error', reject)
    })
  }
}

exports.Transport = Transport
