'use strict'

class Operation {
  #bridge
  #target

  constructor (bridge, target) {
    this.#bridge = bridge
    this.#target = target
  }

  async invoke (input, query) {
    let output
    let error

    const target = await this.#target.query(query)
    const state = target.get()

    const response = await this.#bridge.run(input, state)

    if (response instanceof Array) [output, error] = response
    else output = response

    if (!error && this.#bridge.type === 'transition') {
      error = target.set(state)

      if (!error) {
        // TODO: handle persistence errors
        await this.#target.commit(target)
      }
    }

    if (error) output = null
    else error = null

    return [output, error]
  }
}

exports.Operation = Operation
