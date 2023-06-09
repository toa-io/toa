'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')
const { shards } = require('@toa.io/generic')

const { id } = require('./id')

/**
 * @implements {toa.origins.amqp.Aspect}
 */
class Aspect extends Connector {
  name = id
  /** @type {toa.origins.Manifest} */
  #manifest

  /** @type {Record<string, Partial<comq.IO>>} */
  #origins = {}

  /**
   * @param {toa.origins.Manifest} manifest
   */
  constructor (manifest) {
    super()

    this.#manifest = manifest
  }

  async open () {
    const promises = Object.entries(this.#manifest).map(this.#open)

    await Promise.all(promises)
  }

  async close () {
    const promises = Object.values(this.#origins).map(this.#close)

    await Promise.all(promises)
  }

  async invoke (origin, method, ...args) {
    return this.#origins[origin][method](...args)
  }

  #open = async ([origin, reference]) => {
    const references = shards(reference)
    const io = await assert(...references)

    this.#origins[origin] = restrict(io)
  }

  #close = async (io) => {
    await io.close()
  }
}

/**
 * @param {comq.IO} io
 * @return {Partial<comq.IO>}
 */
function restrict (io) {
  // noinspection JSUnresolvedReference
  return {
    request: (...args) => io.request(...args),
    emit: (...args) => io.emit(...args),
    close: () => io.close()
  }
}

/**
 * @param {toa.origins.Manifest} manifest
 */
function create (manifest) {
  return new Aspect(manifest)
}

exports.create = create
