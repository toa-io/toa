'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./queue')

class Receiver extends Connector {
  #channel
  #receiver
  #queue

  constructor (channel, locator, label, receiver) {
    super()

    this.#channel = channel
    this.#receiver = receiver
    this.#queue = name(locator, label)

    this.depends(channel)
  }

  async connection () {
    console.log(this.#queue)

    // this.#channel.consume(this.#queue, (payload) => this.#receiver.receive(payload))
  }
}

exports.Receiver = Receiver
