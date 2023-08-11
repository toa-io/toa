'use strict'

const { Locator } = require('@toa.io/core')

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')
const { resolveURIs } = require('./deployment/context')

const { SYSTEM } = require('./constants')
const { Communication } = require('./communication')

class Factory {
  producer (locator, endpoints, component) {
    const comm = this.#getContext(locator)

    return new Producer(comm, locator, endpoints, component)
  }

  consumer (locator, endpoint) {
    const comm = this.#getContext(locator)

    return new Consumer(comm, locator, endpoint)
  }

  emitter (locator, label) {
    const comm = this.#getContext(locator)

    return new Emitter(comm, locator, label)
  }

  receiver (locator, label, group, receiver) {
    const comm = this.#getContext(locator)

    return new Receiver(comm, label, group, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator(name, SYSTEM)
    const comm = this.#getContext(locator)

    return new Broadcast(comm, locator, group)
  }

  #getContext (locator) {
    const urls = resolveURIs(locator)

    return new Communication(urls)
  }
}

exports.Factory = Factory
