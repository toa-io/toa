'use strict'

const { Connector } = require('@kookaburra/core')

const { name } = require('./name')

class Receiver extends Connector {
  #channel
  #runtime
  #labels

  constructor (channel, runtime, labels) {
    super()

    this.#channel = channel
    this.#runtime = runtime
    this.#labels = labels

    this.depends(channel)
  }

  async connection () {
    return Promise.all(this.#labels.map((label) => this.#receive(label)))
  }

  async #receive (label) {
    const queue = name(this.#runtime.locator, label)

    console.log(queue)

    // this.#channel.consume(queue, (payload) => this.#runtime.invoke(endpoint, payload))
  }
}

exports.Receiver = Receiver
