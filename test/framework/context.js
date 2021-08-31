'use strict'

const request = require('superagent')

const { composition } = require('../../packages/boot/src/composition')
const { locate } = require('./dummies')

class Context {
  storage

  #components
  #composition
  #port

  constructor (options) {
    this.#components = options.composition

    if (options.storage) { this.storage = Context.#storage(options.storage) }
  }

  request () {
    return ['get', 'post'].reduce((map, method) => {
      map[method] = (path, ...args) =>
        request[method](new URL(path, `http://localhost:${this.#port}`).href, ...args)

      return map
    }, {})
  }

  async setup () {
    if (this.storage) { await this.storage.setup() }

    if (this.#components) {
      this.#composition = await composition(this.#components.map(locate))
      await this.#composition.connect()

      this.#port = +console.info.mock.calls.pop()[1].match(/HTTP server started at :(\d+)$/)[1]
    }
  }

  async teardown () {
    if (this.#composition) { await this.#composition.disconnect() }
    if (this.storage) { await this.storage.teardown() }
  }

  static #storage (storage) {
    const { Storage } = require(`./storages/${storage}`)

    return new Storage()
  }
}

exports.Context = Context
