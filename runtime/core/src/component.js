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

  /** @type {Record<string, object>} span options per endpoint */
  #spans = {}

  constructor (locator, operations) {
    super()

    this.locator = locator
    this.operations = operations

    Object.values(operations).forEach((operation) => this.depends(operation))
  }

  async invoke (endpoint, request) {
    if (!(endpoint in this.operations))
      // `assert.fail`, not `assert.ok`: the message is built only when it is needed
      assert.fail(`Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

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
    return console.span(this.span(endpoint), async () => {
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

  /**
   * The span of an endpoint never changes, so it is built once. Not in the constructor:
   * `kind` is a field of the subclass, and those are assigned after this one is built.
   *
   * @private
   */
  span (endpoint) {
    let options = this.#spans[endpoint]

    if (options === undefined) {
      options = { name: `${this.locator.id}.${endpoint}`, kind: this.kind }

      // the server span is emitted by the component itself, while the client span
      // belongs to the calling service and inherits it from the context
      if (this.kind === 'server')
        options.service = this.locator.id

      this.#spans[endpoint] = options
    }

    return options
  }
}

exports.Component = Component
