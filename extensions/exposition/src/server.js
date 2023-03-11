'use strict'

const express = require('express')
const cors = require('cors')

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/console')

const { PORT } = require('./constants')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.extensions.exposition.Server}
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
    this.#app.use(cors({ allowedHeaders: ['content-type'] }))

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
    console.info(`Starting HTTP server at :${PORT} ...`)

    return new Promise((resolve, reject) => {
      const error = () => reject(new Error(`Error starting HTTP server at :${PORT}`))
      // noinspection JSCheckFunctionSignatures
      this.#server = this.#app.listen(PORT, () => {
        console.info(`HTTP server at :${PORT} started`)

        this.#server.off('error', error)
        resolve()
      })

      this.#server.on('error', error)
    })
  }

  async disconnection () {
    console.info(`Stopping HTTP server at :${PORT} ...`)

    return new Promise((resolve, reject) => {
      const error = () => reject(new Error(`Error stopping HTTP server at :${PORT}`))

      this.#server.close(() => {
        console.info(`HTTP server at :${PORT} stopped`)

        this.#server.off('error', error)
        resolve()
      })

      this.#server.on('error', error)
    })
  }
}

const METHODS = { HEAD: 1, GET: 1, POST: 1, PUT: 1, PATCH: 1 }
const SAFE = { HEAD: 1, GET: 1 }

exports.Server = Server
