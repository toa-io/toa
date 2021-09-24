'use strict'

const { Connector } = require('@kookaburra/core')
const { freeze, defined } = require('@kookaburra/gears')
const load = require('./load')

class Operation extends Connector {
  #name
  #type
  #algorithm
  #context

  constructor (root, name, type, context) {
    super()

    this.#name = name
    this.#type = type
    this.#context = context
    this.#algorithm = load.operation(root, name)
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

    if (this.#type === 'observation') freeze(state)

    return state
  }
}

exports.Operation = Operation
