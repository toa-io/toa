'use strict'

const { Locator } = require('@toa.io/core')

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')
const context = require('./deployment/context')
const sources = require('./deployment/sources')

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
    const comm = this.#getSource(locator)

    return new Receiver(comm, label, group, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator(name, SYSTEM)
    const comm = this.#getContext(locator)

    return new Broadcast(comm, locator, group)
  }

  #getContext (locator) {
    const resolve = async () => context.resolveURIs(locator)

    return new Communication(resolve)
  }

  #getSource (locator) {
    const resolve = (locator.namespace === undefined)
      ? async () => sources.resolveURIs(locator)
      : async () => context.resolveURIs(locator)

    return new Communication(resolve)
  }
}

exports.Factory = Factory
