'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./name')

class Receiver extends Connector {
  #channel
  #locator
  #label
  #receiver

  constructor (channel, locator, label, receiver) {
    super()

    this.#channel = channel
    this.#locator = locator
    this.#label = label
    this.#receiver = receiver

    this.depends(channel)
  }

  async connection () {
    const queue = name(this.#locator, this.#label)

    console.log(queue)

    // this.#channel.consume(queue, (payload) => this.#receiver.receive(payload))
  }
}

exports.Receiver = Receiver
