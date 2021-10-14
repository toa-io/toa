'use strict'

const { concat } = require('@kookaburra/gears')

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')

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

  receiver (locator, label, id, receiver) {
    const channel = this.#channel(locator)

    return new Receiver(channel, locator, label, id, receiver)
  }

  broadcast (name, group) {
    const channel = this.#channel({ domain: 'system', name })

    return new Broadcast(channel, name, group)
  }

  #channel ({ domain, name }) {
    const host = Factory.host(domain, name)

    if (this.#channels[host] === undefined) this.#channels[host] = new Channel(host)

    return this.#channels[host]
  }

  static host (domain, name) {
    return domain + concat('.', name) + '.' + TYPE + '.local'
  }
}

const TYPE = 'amqp'

exports.Factory = Factory
