'use strict'

const express = require('express')

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')

class Transport extends Connector {
  #app
  #port
  #server

  constructor () {
    super()

    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.use(express.json())
    this.#app.get('/', Transport.#ready)

    this.#port = process.env.KOO_ENV === 'dev' ? 0 : 3000
  }

  reply (verb, route, invocation) {
    this.#app[verb.toLowerCase()](route, async (req, res) =>
      res.json(await invocation(req.body, Object.keys(req.query).length ? req.query : null)))
  }

  async connection () {
    return new Promise((resolve, reject) => {
      console.debug(`Starting HTTP server at ${this.#port}`)

      this.#server = this.#app.listen(this.#port, () => {
        this.#port = this.#server.address().port

        console.info(`HTTP server started at :${this.#port}`)

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

  static #ready (_, res) {
    res.send()
  }
}

exports.Transport = Transport
