'use strict'

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')

class Factory {
  #channels = {}

  producer (locator, endpoints, producer) {
    const channel = this.#channel(locator)

    return new Producer(channel, locator, endpoints, producer)
  }

  consumer (locator, endpoint) {
    const channel = this.#channel(locator)

    return new Consumer(channel, locator, endpoint)
  }

  emitter (locator, label) {
    const channel = this.#channel(locator)

    return new Emitter(channel, locator, label)
  }

  receiver (locator, label) {
    const channel = this.#channel(locator)

    return new Receiver(channel, locator, label)
  }

  #channel (locator) {
    const host = locator.host(TYPE)

    if (this.#channels[host] === undefined) this.#channels[host] = new Channel(host)

    return this.#channels[host]
  }
}

const TYPE = 'amqp'

exports.Factory = Factory
