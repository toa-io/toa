'use strict'

const express = require('express')

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

class Server extends Connector {
  #app
  #server

  #port

  constructor () {
    super()

    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.use(express.json())

    this.#port = PORT
  }

  reply (verb, route, invocation) {
    this.#app[verb.toLowerCase()](route, async (req, res) => {
      const reply = await invocation(req.body)

      res.json(reply)
    })
  }

  async connection () {
    return new Promise((resolve, reject) => {
      this.#server = this.#app.listen(this.#port, () => {
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

const PORT = 3000

exports.Server = Server
