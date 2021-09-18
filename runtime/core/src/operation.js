'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Operation extends Connector {
  #declaration
  #contract
  #bridge
  #target

  constructor (declaration, bridge, target, contract) {
    super()

    this.#declaration = declaration
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

    if (request?.query) {
      target = await this.#target.query(request?.query)

      if (target === null) return { output: null }
    } else if (this.#declaration.type === 'transition') {
      target = this.#target.init()
    }

    if (target) state = target.get()

    const reply = await this.#bridge.run(request?.input, state)

    this.#contract.fit(reply)

    if (state && this.#declaration.type === 'transition' && !reply.error) {
      target.set(state)
      await this.#target.commit(target)
    }

    return reply
  }
}

exports.Operation = Operation
