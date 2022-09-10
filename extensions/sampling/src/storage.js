'use strict'

const { match } = require('@toa.io/libraries/generic')

const { context } = require('./sample')
const { SampleException, ReplayException } = require('./exceptions')

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

    if (current !== undefined) {
      if (Array.isArray(current)) throw new SampleException('current must be object')

      return current
    }

    return this.#storage.get(query)
  }

  async find (query) {
    const sample = context.get()
    const current = sample?.storage?.current

    if (current !== undefined) {
      if (!Array.isArray(current)) throw new SampleException('current must be array')

      return current
    }

    return this.#storage.find(query)
  }

  async store (object) {
    const sample = context.get()
    const next = sample?.storage?.next

    if (next !== undefined) {
      const matches = match(object, next)

      if (!matches) throw new ReplayException('next state mismatch')
    }

    return this.#storage.store(object)
  }

  async upsert (query, changeset, insert) {
    return this.#storage.upsert(query, changeset, insert)
  }
}

exports.Storage = Storage
