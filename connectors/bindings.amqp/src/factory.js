'use strict'

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcaster } = require('./broadcaster')
const { Connection } = require('./connection')

/**
 * @implements {toa.core.bindings.Factory}
 */
class Factory {
  #connections = {}

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

  broadcaster (name, group) {
    const channel = this.#channel()

    return new Broadcaster(channel, name, group)
  }

  #channel () {
    const url = new URL('amqp://')

    url.hostname = process.env.TOA_ENV === 'local' ? 'localhost' : 'bindings-amqp-system'
    url.username = 'user'
    url.password = 'password'

    const href = url.href

    if (this.#connections[href] === undefined) this.#connections[href] = new Connection(url)

    return new Channel(this.#connections[href])
  }
}

exports.Factory = Factory
