'use strict'

const assert = require('node:assert')
const { console, decode, run } = require('openspan')
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

    // if the request carries no telemetry, the trace starts here
    const remote = request?.telemetry === undefined ? null : decode(request.telemetry)
    const task = () => this.process(endpoint, request)

    if (remote === null)
      return task()
    else
      return run(remote, task)
  }

  /** @private */
  async process (endpoint, request) {
    return console.span(`${this.locator.id}.${endpoint}`, async () => {
      const reply = await this.operations[endpoint].invoke(request)

      if (reply?.exception !== undefined)
        console.error('Failed to execute operation', {
          endpoint: `${this.locator.id}.${endpoint}`,
          exception: reply.exception
        })

      return reply
    })
  }
}

exports.Component = Component
