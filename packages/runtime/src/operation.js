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
    const object = await this.#target?.query(query)
    // TODO: collection?
    // TODO: add move cloning/serialization to Bridge
    const state = { ...object.state }

    await this.#algorithm(io, state)

    if (this.#type === 'transition') {
      object.state = state
      await this.#target.commit(object)
    }
  }
}

exports.Operation = Operation
