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

    Object.entries(operations).forEach(([_, operation]) => this.depends(operation))
  }

  connection () {
    console.info(`Runtime '${this.locator.fqn}' connected`)
  }

  disconnection () {
    console.info(`Runtime '${this.locator.fqn}' disconnected`)
  }

  async invoke (name, request) {
    if (!(name in this.#operations)) { throw new Error(`Operation '${name}' not found in '${this.locator.fqn}'`) }

    return this.#operations[name].invoke(request)
  }
}

exports.Runtime = Runtime
