'use strict'

const { context } = require('./sample')
const { SampleException } = require('./exceptions')

/**
 * @implements {toa.core.Storage}
 */
class Storage {
  /** @type {toa.core.Storage} */
  #storage

  constructor (storage) {
    this.#storage = storage
  }

  async get (query) {
    const sample = context.get()
    const current = sample?.storage?.current

    if (current === undefined) return this.#storage.get(query)

    if (Array.isArray(current)) throw new SampleException('current must be object')

    return current
  }

  async find (query) {
    const sample = context.get()
    const current = sample?.storage?.current

    if (current === undefined) return this.#storage.find(query)

    if (!Array.isArray(current)) throw new SampleException('current must be array')

    return current
  }
}

exports.Storage = Storage
