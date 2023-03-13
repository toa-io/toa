'use strict'

const { Pointer } = require('./pointer')
const { Communication } = require('./communication')
const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')

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
