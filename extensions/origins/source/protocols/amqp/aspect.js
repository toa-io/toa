'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')
const protocol = require('./index')

class Aspect extends Connector {
  name = protocol.id

  #resolve

  /** @type {Record<string, Partial<comq.IO>>} */
  #origins = {}

  constructor (resolve) {
    super()

    this.#resolve = resolve
  }

  async open () {
    const cfg = await this.#resolve()
    const promises = Object.entries(cfg.origins).map(this.#open)

    await Promise.all(promises)
  }

  async close () {
    const promises = Object.values(this.#origins).map(this.#close)

    await Promise.all(promises)
  }

  async invoke (origin, method, ...args) {
    if (this.#origins[origin]?.[method] === undefined) {
      throw new Error(`Origin "${origin}" or method "${method}" is undefined`)
    }

    return this.#origins[origin][method](...args)
  }

  #open = async ([origin, references]) => {
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

function create (resolve) {
  return new Aspect(resolve)
}

exports.create = create
