'use strict'

const { Locator } = require('@toa.io/core')

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')

class Factory {
  producer (locator, endpoints, producer) {
    const channel = Factory.#channel(locator)

    return new Producer(channel, locator, endpoints, producer)
  }

  consumer (locator, endpoint) {
    const channel = Factory.#channel(locator)

    return new Consumer(channel, locator, endpoint)
  }

  emitter (locator, label) {
    const channel = Factory.#channel(locator)

    return new Emitter(channel, locator, label)
  }

  receiver (locator, label, id, receiver) {
    const channel = Factory.#channel(locator)

    return new Receiver(channel, locator, label, id, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator()
    const channel = Factory.#channel(locator)

    return new Broadcast(channel, name, group)
  }

  static #channel (locator) {
    const host = locator.host('rabbitmq')

    // TODO: one connection (pool) per host
    return new Channel(host)
  }
}

exports.Factory = Factory
