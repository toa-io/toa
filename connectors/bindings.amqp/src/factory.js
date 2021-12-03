'use strict'

const { Locator } = require('@toa.io/core')

const { Channel } = require('./channel')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')
const { Connection } = require('./connection')

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

  broadcast (name, group) {
    const locator = new Locator()
    const channel = this.#channel(locator)

    return new Broadcast(channel, name, group)
  }

  #channel () {
    const host = 'rabbitmq' // locator.host('rabbitmq')

    if (this.#connections[host] === undefined) {
      this.#connections[host] = new Connection(host)
    }

    return new Channel(this.#connections[host])
  }
}

exports.Factory = Factory
