'use strict'

const assert = require('node:assert')
const { console } = require('openspan')
const { Connector } = require('./connector')

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

    const reply = await this.operations[endpoint].invoke(request)

    if (reply?.exception !== undefined)
      console.error('Failed to execute operation', {
        endpoint: `${this.locator.id}.${endpoint}`,
        exception: reply.exception
      })

    return reply
  }
}

exports.Component = Component
