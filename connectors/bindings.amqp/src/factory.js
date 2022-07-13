'use strict'

const { Locator } = require('@toa.io/core')

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcaster } = require('./broadcaster')
const { Connection } = require('./connection')
const { Pointer } = require('./pointer')
const { SYSTEM } = require('./constants')

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

  /**
   * @param {toa.core.Locator} [locator]
   * @returns {Channel}
   */
  #channel (locator) {
    if (locator === undefined) locator = new Locator(SYSTEM)

    const pointer = new Pointer(locator)
    const key = pointer.reference

    if (this.#connections[key] === undefined) {
      this.#connections[key] = new Connection(pointer)
    }

    return new Channel(this.#connections[key])
  }
}

exports.Factory = Factory
