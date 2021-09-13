'use strict'

const { Locator } = require('@kookaburra/core')

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')

class Factory {
  #channels = {}

  constructor () {
    this.#channels.system = this.#channel(Locator.host('system', null, TYPE))
  }

  producer (runtime, endpoints) {
    const channel = this.#channel(runtime.locator.host(TYPE))

    return Factory.#producer(channel, runtime, endpoints)
  }

  consumer (locator) {
    const channel = this.#channel(locator.host(TYPE))

    return Factory.#consumer(channel, locator)
  }

  exposition (runtime, endpoints) {
    return Factory.#producer(this.#channels.system, runtime, endpoints)
  }

  discovery (locator) {
    return Factory.#consumer(this.#channels.system, locator)
  }

  static #producer (channel, runtime, endpoints) {
    return new Producer(channel, runtime, endpoints)
  }

  static #consumer (channel, locator) {
    return new Consumer(channel, locator)
  }

  #channel (host) {
    if (!this.#channels[host]) this.#channels[host] = new Channel(host)

    return this.#channels[host]
  }
}

const TYPE = 'amqp'

exports.Factory = Factory
