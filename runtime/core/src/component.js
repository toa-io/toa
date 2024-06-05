'use strict'

const { Connector } = require('./connector')
const assert = require('node:assert')

class Component extends Connector {
  locator

  /** @protected */
  operations

  constructor (locator, operations) {
    super()

    this.locator = locator
    this.operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  async invoke (endpoint, request) {
    assert.ok(endpoint in this.operations,
      `Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].invoke(request)
  }
}

exports.Component = Component
