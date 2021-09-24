'use strict'

const { Connector } = require('@kookaburra/core')
const { name } = require('./name')

class Transmitter extends Connector {
  #channel
  #locator

  constructor (channel, locator) {
    super()

    this.#channel = channel
    this.#locator = locator
  }

  async emit (label, payload) {
    const queue = name(this.#locator, label)

    await this.#channel.transmit(queue, payload)
  }
}

exports.Transmitter = Transmitter
