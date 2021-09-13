'use strict'

const { Connector } = require('@kookaburra/core')
const { freeze } = require('@kookaburra/gears')

const { resolve } = require('path')
const { parse } = require('./bridge/parse')

class Bridge extends Connector {
  #manifest
  #algorithm
  #context

  constructor (manifest, context) {
    super()

    this.#manifest = manifest
    this.#algorithm = require(manifest['.bridge'].path)
    this.#context = context

    this.depends(context)
  }

  async run (input, state) {
    if (input) input = freeze(input)
    if (state) state = this.#state(state)

    return this.#algorithm(input, state, this.#context)
  }

  get type () {
    return this.#manifest.type
  }

  #state (state) {
    if (state instanceof Array) return state.map((state) => this.#state(state))

    const id = state.id

    Object.defineProperty(state, 'id', { get: () => id })

    for (const key of Object.keys(state)) {
      if (key[0] === '_') Object.defineProperty(state, key, { enumerable: false })
    }

    if (this.#manifest.type === 'observation') freeze(state)

    return state
  }

  static async manifest (root, name) {
    const path = resolve(root, 'operations', name + '.js')
    const algorithm = require(path)

    let manifest

    try { manifest = parse(algorithm) } catch (e) {
      e.message = `Operation '${name}': ${e.message}`
      throw e
    }

    manifest['.bridge'] = { path }

    return manifest
  }
}

exports.Bridge = Bridge
