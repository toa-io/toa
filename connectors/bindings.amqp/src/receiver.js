'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./queue')

class Receiver extends Connector {
  #channel
  #receiver
  #label
  #id

  constructor (channel, locator, label, id, receiver) {
    super()

    this.#channel = channel
    this.#receiver = receiver
    this.#label = name(locator, label)
    this.#id = id

    this.depends(channel)
  }

  async connection () {
    await this.#channel.subscribe(this.#label, this.#id, (payload) => this.#receiver.receive(payload))
  }
}

exports.Receiver = Receiver
