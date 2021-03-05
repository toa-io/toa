'use strict'

const freeze = require('deep-freeze')

class Operation {
  #algorithm
  #type
  #target

  constructor (operation, target) {
    this.#algorithm = operation.algorithm
    this.#type = operation.type
    this.#target = target
  }

  async execute (io, query) {
    const state = await this.#target?.query(query)

    if (this.#type === 'observation') { freeze(state) }

    await this.#algorithm(io, state)

    if (this.#type === 'transition') { await this.#target.persist(state) }
  }
}

exports.Operation = Operation
