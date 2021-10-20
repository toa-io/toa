'use strict'

const { concat } = require('@toa.io/gears')

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
    const channel = Factory.#channel({ domain: 'system', name })

    return new Broadcast(channel, name, group)
  }

  static #channel ({ domain, name }) {
    const host = Factory.host(domain, name)

    // TODO: one connection (pool) per host
    return new Channel(host)
  }

  static host (domain, name) {
    return domain + concat('.', name) + '.' + TYPE + '.local'
  }
}

const TYPE = 'amqp'

exports.Factory = Factory
