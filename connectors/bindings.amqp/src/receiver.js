'use strict'

const { Connector } = require('@toa.io/core')

const { name } = require('./queue')

class Receiver extends Connector {
  #channel
  /** @type {toa.core.Receiver} */
  #receiver

  /** @type {string} */
  #label

  /** @type {string} */
  #id

  constructor (channel, locator, label, id, receiver) {
    super()

    this.#channel = channel
    this.#receiver = receiver
    this.#label = name(locator, label)
    this.#id = id

    this.depends(channel)
    this.depends(receiver)
  }

  async open () {
    await this.#channel.subscribe(this.#label, this.#id, (message) => this.#receiver.receive(message))
  }

  async close () {
    await this.#channel.unsubscribe(this.#id)
  }
}

exports.Receiver = Receiver
