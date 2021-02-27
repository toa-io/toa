'use strict'

const { console } = require('@kookaburra/gears')
const { Connector } = require('./connector')
const { IO } = require('./io')

class Runtime extends Connector {
  locator

  #invocations = {}

  constructor (locator, invocations) {
    super()

    this.locator = locator
    this.#invocations = invocations
  }

  connection () {
    console.info(`Runtime '${this.locator.name}' connected`)
  }

  disconnection () {
    console.info(`Runtime '${this.locator.name}' disconnected`)
  }

  async invoke (name, input) {
    if (!(name in this.#invocations)) { throw new Error(`Operation '${name}' not found in '${this.locator.name}'`) }

    const io = new IO(input)

    await this.#invocations[name].invoke(io)

    return io
  }
}

exports.Runtime = Runtime
