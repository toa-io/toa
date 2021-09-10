'use strict'

const request = require('superagent')

const { composition } = require('../../core/boot/src/composition')
const { locate } = require('./dummies')

class Context {
  storage

  #bindings
  #components
  #composition
  #port

  constructor (options) {
    this.#components = options.composition

    if (options.storage) this.storage = Context.#storage(options.storage)
    if (options.bindings) this.#bindings = options.bindings.map((binding) => '@kookaburra/bindings.' + binding)
  }

  request () {
    return ['get', 'post'].reduce((map, method) => {
      map[method] = (path, ...args) =>
        request[method](new URL(path, `http://localhost:${this.#port}`).href, ...args).ok(() => true)

      return map
    }, {})
  }

  async setup () {
    if (this.storage) { await this.storage.setup() }

    if (this.#components) {
      this.#composition = await composition(this.#components.map(locate), { bindings: this.#bindings })
      await this.#composition.connect()

      console.info.mock.calls.find((call) => {
        const match = call[1].match(/HTTP server started at :(\d+)$/)

        if (match) this.#port = match[1]

        return match
      })
    }
  }

  async teardown () {
    if (this.#composition) await this.#composition.disconnect()
    if (this.storage) await this.storage.teardown()
  }

  static #storage (storage) {
    const { Storage } = require(`./storages/${storage}`)

    return new Storage()
  }
}

exports.Context = Context
