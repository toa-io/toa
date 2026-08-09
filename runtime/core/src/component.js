'use strict'

const assert = require('node:assert')
const { console, current, decode, run } = require('openspan')
const { Connector } = require('./connector')

class Component extends Connector {
  locator

  /** @protected */
  operations

  /** @protected */
  kind = 'server'

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
    const options = { name: `${this.locator.id}.${endpoint}`, kind: this.kind }

    // the server span is emitted by the component itself,
    // while the client span belongs to the calling service and inherits it from the context
    if (this.kind === 'server')
      options.service = this.locator.id

    return console.span(options, async () => {
      const reply = await this.operations[endpoint].invoke(request)

      if (reply?.exception !== undefined) {
        current().status = 'error'

        console.error('Failed to execute operation', {
          endpoint: `${this.locator.id}.${endpoint}`,
          exception: reply.exception
        })
      }

      return reply
    })
  }
}

exports.Component = Component
