'use strict'

class Operation {
  #bridge
  #target

  constructor (bridge, target) {
    this.#bridge = bridge
    this.#target = target
  }

  async invoke (io, query) {
    const target = await this.#target?.query(query)

    // TODO: add move cloning/serialization to Bridge
    const state = target.state

    await this.#bridge.run(io, state)

    if (this.#bridge.type === 'transition') {
      target.state = state
      await this.#target.commit(target)
    }
  }
}

exports.Operation = Operation
