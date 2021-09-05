'use strict'

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')

class Factory {
  #channels = {}

  producer (runtime) {
    const channel = this.#channel(runtime.locator)

    return new Producer(channel, runtime)
  }

  consumer (locator) {
    const channel = this.#channel(locator)

    return new Consumer(channel, locator)
  }

  #channel (locator) {
    const name = locator.name

    if (!this.#channels[name]) this.#channels[name] = new Channel(locator.host('amqp'), locator.name)

    return this.#channels[name]
  }
}

exports.Factory = Factory
