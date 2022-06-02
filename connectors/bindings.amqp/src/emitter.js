'use strict'

const { Connector } = require('@toa.io/core')
const { name } = require('./queue')

/**
 * @implements {toa.core.connectors.bindings.Emitter}
 */
class Emitter extends Connector {
  #channel
  #locator
  #label

  constructor (channel, locator, label) {
    super()

    this.#channel = channel
    this.#locator = locator
    this.#label = label

    this.depends(channel)
  }

  async emit (payload) {
    const label = name(this.#locator, this.#label)

    await this.#channel.publish(label, payload)
  }
}

exports.Emitter = Emitter
