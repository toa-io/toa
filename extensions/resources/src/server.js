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

    // TODO: remove express
    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.enable('case sensitive routing')
    this.#app.enable('strict routing')
    this.#app.disable('etag')
    this.#app.use(express.json())

    this.#app.use((req, res, next) => {
      req.safe = req.method in SAFE

      if (req.method in METHODS) next()
      else res.status(501).end()
    })

    this.#port = PORT
  }

  route (route, callback) {
    this.#app.use(route, callback)
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

const PORT = 8000
const METHODS = { HEAD: 1, GET: 1, POST: 1, PUT: 1 }
const SAFE = { HEAD: 1, GET: 1 }

exports.Server = Server
