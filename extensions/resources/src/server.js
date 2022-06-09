'use strict'

const express = require('express')
const cors = require('cors')

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

const { PORT } = require('./constants')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.extensions.resources.Server}
 */
class Server extends Connector {
  /** @type {import('express').Application} */
  #app
  /** @type {import('http').Server} */
  #server

  constructor () {
    super()

    // TODO: remove express
    this.#app = express()
    this.#app.disable('x-powered-by')
    this.#app.enable('case sensitive routing')
    this.#app.enable('strict routing')
    this.#app.disable('etag')
    this.#app.use(express.json())
    this.#app.use(cors())

    this.#app.use((req, res, next) => {
      req.safe = req.method in SAFE

      if (req.method in METHODS) next()
      else res.status(501).end()
    })
  }

  route (route, callback) {
    this.#app.use(route, callback)
  }

  async connection () {
    return new Promise((resolve, reject) => {
      // noinspection JSCheckFunctionSignatures
      this.#server = this.#app.listen(PORT, () => {
        console.info(`HTTP server started at :${PORT}`)

        this.#server.off('error', reject)
        resolve()
      })

      this.#server.on('error', reject)
    })
  }

  async disconnection () {
    return new Promise((resolve, reject) => {
      this.#server.close(() => {
        console.info(`HTTP server at :${PORT} stopped`)

        this.#server.off('error', reject)
        resolve()
      })

      this.#server.on('error', reject)
    })
  }
}

const METHODS = { HEAD: 1, GET: 1, POST: 1, PUT: 1, PATCH: 1 }
const SAFE = { HEAD: 1, GET: 1 }

exports.Server = Server
