'use strict'

class Operation {
  #algorithm
  #type
  #target

  constructor (operation, target) {
    this.#algorithm = operation.algorithm
    this.#type = operation.type
    this.#target = target
  }

  async invoke (io, query) {
    const target = await this.#target?.query(query)

    // TODO: add move cloning/serialization to Bridge
    const state = target.state

    await this.#algorithm(io, state)

    if (this.#type === 'transition') {
      target.state = state
      await this.#target.commit(target)
    }
  }
}

exports.Operation = Operation
