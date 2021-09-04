'use strict'

const { console } = require('@kookaburra/gears')
const { Connector } = require('./connector')

class Runtime extends Connector {
  locator

  #operations

  constructor (locator, operations) {
    super()

    this.locator = locator
    this.#operations = operations
  }

  connection () {
    console.info(`Runtime '${this.locator.name}' connected`)
  }

  disconnection () {
    console.info(`Runtime '${this.locator.name}' disconnected`)
  }

  async invoke (name, input, query) {
    if (!(name in this.#operations)) { throw new Error(`Operation '${name}' not found in '${this.locator.name}'`) }

    return this.#operations[name].invoke(input, query)
  }
}

exports.Runtime = Runtime
