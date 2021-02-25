'use strict'

const { Connector } = require('./connector')
const { IO } = require('./io')

class Runtime extends Connector {
  locator
  #invocations = {}

  constructor (invocations) {
    super()
    this.#invocations = invocations
  }

  connection () {
    console.log('Runtime started')
  }

  disconnection () {
    console.log('Runtime stopped')
  }

  async invoke (name, input) {
    if (!(name in this.#invocations)) { throw new Error(`Operation '${name}' not found`) }

    const io = new IO(input)

    await this.#invocations[name].invoke(io)

    return io
  }
}

exports.Runtime = Runtime
