'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')
const protocol = require('./index')

class Aspect extends Connector {
  name = protocol.id

  #declarations
  #origins = {}

  constructor (origins) {
    super()

    this.#declarations = origins
  }

  async open () {
    const promises = Object.entries(this.#declarations).map(this.#open)

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

function restrict (io) {
  // noinspection JSUnresolvedReference
  return {
    request: (...args) => io.request(...args),
    emit: (...args) => io.emit(...args),
    close: () => io.close()
  }
}

function create (declaration) {
  return new Aspect(declaration.origins)
}

exports.create = create
