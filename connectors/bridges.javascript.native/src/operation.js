'use strict'

const { Connector } = require('@toa.io/core')

class Operation extends Connector {
  #operation
  #context

  constructor (operation, context) {
    super()

    this.#operation = operation.observation || operation.transition
    this.#context = context

    this.depends(context)
  }

  async run (input, state) {
    return this.#operation(input, state, this.#context)
  }
}

exports.Operation = Operation
