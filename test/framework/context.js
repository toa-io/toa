'use strict'

const { yaml } = require('../../packages/gears/src/yaml')

const { locate } = require('./dummies')
const { CLI } = require('./cli')

class Context {
  cli
  storage

  #manifest

  constructor (options) {
    const path = locate(options.dummy)

    this.#manifest = yaml.sync(`${path}/manifest.yaml`)
    this.cli = new CLI(path)

    if (options.storage) { this.storage = this.#storage(options.storage) }
  }

  async setup () {
    if (this.storage) { await this.storage.setup() }
  }

  async teardown () {
    if (this.storage) { await this.storage.teardown() }
  }

  #storage (storage) {
    const { Storage } = require(`./storages/${storage}`)

    return new Storage(this.#manifest.domain, this.#manifest.name)
  }
}

exports.Context = Context
