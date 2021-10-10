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
    let output, error

    output = await this.#operation(input, state, this.#context)

    if (output instanceof Array) [output, error] = output
    if (output === null) output = undefined

    return defined({ output, error })
  }
}

exports.Operation = Operation
