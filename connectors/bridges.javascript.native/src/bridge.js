'use strict'

const { Connector } = require('@kookaburra/runtime')
const { freeze } = require('@kookaburra/gears')

const { resolve } = require('path')
const { parse } = require('./bridge/parse')

class Bridge extends Connector {
  #manifest
  #algorithm

  constructor (manifest) {
    super()

    this.#manifest = manifest
    this.#algorithm = require(manifest['.bridge'].path)
  }

  async run (io, state) {
    if (state) { this.#protect(state) }

    try {
      const output = await this.#algorithm(io.input, state)

      if (output !== undefined) { io.output = output }
    } catch (e) {
      if (e instanceof Error) { throw e }

      io.error = e
    }
  }

  get type () {
    return this.#manifest.type
  }

  #protect (state) {
    for (const key of Object.keys(state)) {
      if (key[0] === '_') { Object.defineProperty(state, key, { enumerable: false }) }
    }

    if (this.#manifest.type === 'observation') { freeze(state) }

    return state
  }

  static async manifest (root, name) {
    const path = resolve(root, 'operations', name + '.js')
    const algorithm = require(path)

    let manifest

    try {
      manifest = parse(algorithm)
    } catch (e) {
      e.message = `Operation '${name}': ${e.message}`
      throw e
    }

    manifest['.bridge'] = { path }

    return manifest
  }
}

exports.Bridge = Bridge
