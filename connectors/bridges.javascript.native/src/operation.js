'use strict'

const { Connector } = require('@kookaburra/core')
const { freeze, defined } = require('@kookaburra/gears')
const load = require('./load')

class Operation extends Connector {
  #declaration
  #algorithm
  #context

  constructor (root, declaration, context) {
    super()

    this.#declaration = declaration
    this.#context = context
    this.#algorithm = load.operation(root, declaration.name)
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
}

exports.Operation = Operation
