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
    const host = locator.host('amqp')
    const id = host + '/' + locator.fqn

    if (!this.#channels[id]) this.#channels[id] = new Channel(host)

    return this.#channels[id]
  }
}

exports.Factory = Factory
