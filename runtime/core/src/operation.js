'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./contract')

class Operation extends Connector {
  #contract
  #bridge
  #target

  constructor (bridge, target, contract) {
    super()

    this.#bridge = bridge
    this.#target = target
    this.#contract = contract

    this.depends(bridge)
  }

  async invoke (request) {
    try {
      return await this.#invoke(request)
    } catch (e) {
      let exception

      if (e instanceof Error) exception = new Exception(e)
      else exception = e

      return { exception }
    }
  }

  async #invoke (request) {
    let target, state

    if (request?.query || this.#bridge.type === 'transition') {
      // TODO: initial state
      target = await this.#target.query(request?.query)
      state = target.get()

      if (state === null) return { output: null }
    }

    const reply = await this.#bridge.run(request?.input, state)

    this.#contract.fit(reply)

    if (state && this.#bridge.type === 'transition' && !reply.error) {
      target.set(state)
      await this.#target.commit(target)
    }

    return reply
  }
}

exports.Operation = Operation
