'use strict'

const { Locator } = require('@toa.io/core')

const { Pointer } = require('./pointer')
const { Communication } = require('./communication')
const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')

const { SYSTEM } = require('./constants')

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

  /**
   * @param {toa.core.Locator} locator
   * @param {string} label
   * @return {Emitter}
   */
  emitter (locator, label) {
    const comm = this.#getCommunication(locator)

    return new Emitter(comm, locator, label)
  }

  /**
   * @param {toa.core.Locator} source
   * @param {string} label
   * @param {string} group
   * @param {toa.core.Receiver} receiver
   * @return {Receiver}
   */
  receiver (source, label, group, receiver) {
    const comm = this.#getCommunication(source)

    return new Receiver(comm, label, group, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator(name, SYSTEM)
    const comm = this.#getCommunication(locator)

    return new Broadcast(comm, locator, group)
  }

  /**
   *
   * @param {toa.core.Locator} source
   * @return {toa.amqp.Communication}
   */
  #getCommunication (source) {
    const pointer = /** @type {toa.pointer.Pointer} */ new Pointer(source)

    return new Communication(pointer)
  }
}

exports.Factory = Factory
