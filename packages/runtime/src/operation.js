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
    const entry = await this.#target?.query(query)
    // TODO: collection?
    // TODO: add move cloning/serialization to Bridge
    const state = { ...entry.state }

    await this.#algorithm(io, state)

    if (this.#type === 'transition') {
      entry.state = state
      await this.#target.commit(entry)
    }
  }
}

exports.Operation = Operation
