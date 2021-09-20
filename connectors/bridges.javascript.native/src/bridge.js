'use strict'

const { Connector } = require('@kookaburra/core')
const { freeze, defined } = require('@kookaburra/gears')

const { resolve } = require('path')
const { parse } = require('./bridge/parse')

class Bridge extends Connector {
  #declaration
  #algorithm
  #context

  constructor (declaration, root, context) {
    super()

    this.#declaration = declaration
    this.#context = context
    this.#algorithm = Bridge.#require(root, declaration.name)
  }

  async run (input, state) {
    if (input) input = freeze(input)
    if (state) state = this.#state(state)

    let output, error

    output = await this.#algorithm(input, state, this.#context)

    if (output instanceof Array) [output, error] = output
    if (output === null) output = undefined

    return defined({ output, error })
  }

  #state (state) {
    if (state instanceof Array) return state.map((state) => this.#state(state))

    const id = state.id

    Object.defineProperty(state, 'id', { get: () => id })

    for (const key of Object.keys(state)) {
      if (key[0] === '_') Object.defineProperty(state, key, { enumerable: false })
    }

    if (this.#declaration.type === 'observation') freeze(state)

    return state
  }

  static async declaration (root, name) {
    const algorithm = this.#require(root, name)

    let declaration

    try {
      declaration = parse(algorithm)
    } catch (e) {
      e.message = `Operation '${name}': ${e.message}`
      throw e
    }

    return declaration
  }

  static #require (root, name) {
    const path = resolve(root, 'operations', name + '.js')

    return require(path)
  }
}

exports.Bridge = Bridge
