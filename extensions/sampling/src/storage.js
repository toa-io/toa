'use strict'

const { match, newid } = require('@toa.io/generic')
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

    /** @type {toa.core.storages.Record} */
    let object

    if (sample !== undefined) object = this.#get(sample)
    if (object === undefined) object = await this.#storage.get(query)

    return object
  }

  async find (query) {
    const sample = context.get()

    /** @type {toa.core.storages.Record[]} */
    let objects

    if (sample !== undefined) objects = this.#get(sample, true)
    if (objects === undefined) objects = await this.#storage.find(query)

    return objects
  }

  async store (object) {
    /** @type {toa.sampling.request.Sample} */
    const sample = context.get()

    /** @type {boolean} */
    let result

    if (sample !== undefined) result = this.#store(object, sample)
    if (result === undefined) result = await this.#storage.store(object)

    return result
  }

  async upsert (query, changeset, insert) {
    return this.#storage.upsert(query, changeset, insert)
  }

  /**
   * @param {toa.sampling.request.Sample} sample
   * @param {boolean} [array]
   * @returns {toa.core.storages.Record | toa.core.storages.Record[] | undefined}
   */
  #get (sample, array = false) {
    const current = sample.storage?.current

    if (current === undefined && sample.autonomous === true) {
      throw new SampleException('autonomous sample must contain current state')
    }

    if (current === undefined) return

    if (Array.isArray(current) !== array) {
      throw new SampleException('current state must be an ' + (array ? 'array' : 'object'))
    }

    return array ? current.map(normalize) : normalize(current)
  }

  /**
   * @param {toa.core.storages.Record} object
   * @param {toa.sampling.request.Sample} sample
   * @returns {boolean | undefined}
   */
  #store (object, sample) {
    const next = sample.storage?.next

    if (next === undefined && sample.autonomous === true) {
      throw new SampleException('autonomous sample must contain next state')
    }

    if (next === undefined) return

    const matches = match(object, next)

    if (!matches) throw new ReplayException('next state mismatch')

    return true
  }
}

const normalize = (object) => ({ id: newid(), ...object })

exports.Storage = Storage
