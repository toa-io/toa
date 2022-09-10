'use strict'

const { match, newid } = require('@toa.io/libraries/generic')
const { Connector } = require('@toa.io/core')

const { context } = require('./sample')
const { SampleException, ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.Storage}
 */
class Storage extends Connector {
  /** @type {toa.core.Storage} */
  #storage

  constructor (storage) {
    super()

    this.#storage = storage

    this.depends(storage)
  }

  async get (query) {
    const sample = context.get()
    const current = sample?.storage?.current

    if (current !== undefined) {
      if (Array.isArray(current)) throw new SampleException('current must be object')

      return normalize(current)
    }

    return this.#storage.get(query)
  }

  async find (query) {
    const sample = context.get()
    const current = sample?.storage?.current

    if (current !== undefined) {
      if (!Array.isArray(current)) throw new SampleException('current must be array')

      return current.map(normalize)
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

const normalize = (object) => ({ id: newid(), ...object })

exports.Storage = Storage
