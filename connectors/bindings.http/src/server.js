'use strict'

const express = require('express')

const { Connector } = require('@kookaburra/runtime')
const { console } = require('@kookaburra/gears')

const { response } = require('./response')

class Server extends Connector {
  #app
  #port
  #server

  constructor () {
    super()

    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.use(express.json())

    this.#port = process.env.KOO_ENV === 'dev' ? 0 : 3000
  }

  reply (verb, route, invocation) {
    this.#app[verb.toLowerCase()](route, async (req, res) => {
      let output, error, exception

      try {
        [output, error] = await invocation(req.body.input, req.body.query)
      } catch (e) {
        exception = e
      }

      response(output, error, exception, res)
      res.end()
    })
  }

  async connection () {
    return new Promise((resolve, reject) => {
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
      this.#server.close(() => {
        console.info(`HTTP server at :${this.#port} stopped`)

        this.#server.off('error', reject)
        resolve()
      })

      this.#server.on('error', reject)
    })
  }
}

exports.Server = Server
