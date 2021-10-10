'use strict'

const { defined } = require('@kookaburra/gears')
const { Connector } = require('@kookaburra/core')

class Operation extends Connector {
  #operation
  #context

  constructor (operation, context) {
    super()

    this.#operation = operation.observation || operation.transition
    this.#context = context
  }

  async run (input, state) {
    if (state) state = this.#state(state)

    let output, error

    output = await this.#operation(input, state, this.#context)

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

    return state
  }
}

exports.Operation = Operation
