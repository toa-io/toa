'use strict'

const { IO } = require('./io')

class Runtime {
  #invocations = {}

  constructor (invocations) {
    this.#invocations = invocations
  }

  async start () {

  }

  async stop () {

  }

  async invoke (name, input) {
    if (!(name in this.#invocations)) { throw new Error(`Operation '${name}' not found`) }

    const io = new IO(input)

    await this.#invocations[name].invoke(io)

    return io
  }
}

exports.Runtime = Runtime
