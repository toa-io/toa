'use strict'

const { AsyncLocalStorage } = require('node:async_hooks')

/** @type {toa.generic.Context} */
const context = (id) => {
  if (instances[id] === undefined) instances[id] = new Storage()

  return instances[id]
}

const instances = {}

/**
 * @implements {toa.generic.context.Storage}
 */
class Storage {
  #storage

  constructor () {
    this.#storage = new AsyncLocalStorage()
  }

  async apply (value, func) {
    await this.#storage.run(value, func)
  }

  get () {
    return this.#storage.getStore()
  }
}

exports.context = context
