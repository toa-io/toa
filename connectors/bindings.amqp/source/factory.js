'use strict'

const { Locator } = require('@toa.io/core')
const { connector } = require('@toa.io/generics.amqp')

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')

const { SYSTEM } = require('./constants')

class Factory {
  producer (locator, endpoints, component) {
    const comm = this.#getCommunication(locator)

    return new Producer(comm, locator, endpoints, component)
  }

  consumer (locator, endpoint) {
    const comm = this.#getCommunication(locator)

    return new Consumer(comm, locator, endpoint)
  }

  emitter (locator, label) {
    const comm = this.#getCommunication(locator)

    return new Emitter(comm, locator, label)
  }

  receiver (locator, label, group, receiver) {
    const comm = this.#getCommunication(locator)

    return new Receiver(comm, label, group, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator(name, SYSTEM)
    const comm = this.#getCommunication(locator)

    return new Broadcast(comm, locator, group)
  }

  #getCommunication (locator) {
    // TODO: replace this method with getSource(name) and getContext(locator)
    return connector('amqp-source', locator.id)
  }
}

exports.Factory = Factory
