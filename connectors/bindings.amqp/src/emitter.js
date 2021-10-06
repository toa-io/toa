'use strict'

const { Connector } = require('@kookaburra/core')
const { name } = require('./queue')

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
