'use strict'

const { console } = require('@toa.io/console')
const { Connector } = require('./connector')
const { NotImplementedException } = require('./exceptions')

/**
 * @implements {toa.core.Component}
 */
class Component extends Connector {
  locator

  #operations

  constructor (locator, operations) {
    super()

    this.locator = locator
    this.#operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  async open () {
    console.info(`Runtime '${this.locator.id}' connected`)
  }

  async dispose () {
    console.info(`Runtime '${this.locator.id}' disconnected`)
  }

  async invoke (endpoint, request) {
    if (!(endpoint in this.#operations)) {
      throw new NotImplementedException(`Endpoint '${endpoint}' not found in '${this.locator.id}'`)
    }

    return this.#operations[endpoint].invoke(request)
  }
}

exports.Component = Component
