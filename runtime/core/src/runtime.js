'use strict'

const { console } = require('@toa.io/gears')
const { Connector } = require('./connector')
const { NotImplementedException } = require('./exceptions')

class Runtime extends Connector {
  locator

  #operations

  constructor (locator, operations) {
    super()

    this.locator = locator
    this.#operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  async connection () {
    console.info(`Runtime '${this.locator.id}' connected`)
  }

  disconnected () {
    console.info(`Runtime '${this.locator.id}' disconnected`)
  }

  async invoke (endpoint, request) {
    if (!(endpoint in this.#operations)) {
      throw new NotImplementedException(`Endpoint '${endpoint}' not found in '${this.locator.id}'`)
    }

    return this.#operations[endpoint].invoke(request)
  }
}

exports.Runtime = Runtime
