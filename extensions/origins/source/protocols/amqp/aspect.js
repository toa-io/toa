'use strict'

const { connect } = require('comq')
const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.origins.amqp.Aspect}
 */
class Aspect extends Connector {
  name = 'amqp'
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
    const io = await connect(reference)

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
