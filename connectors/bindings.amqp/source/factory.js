'use strict'

const { Pointer } = require('./pointer')
const { Communication } = require('./communication')
const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')

/**
 * @implements {toa.core.bindings.Factory}
 */
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

    return new Receiver(comm, locator, label, group, receiver)
  }

  /**
   *
   * @param {toa.core.Locator} locator
   * @return {toa.amqp.Communication}
   */
  #getCommunication (locator) {
    const pointer = /** @type {toa.pointer.Pointer} */ new Pointer(locator)

    return new Communication(pointer)
  }
}

exports.Factory = Factory
