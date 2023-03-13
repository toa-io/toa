'use strict'

const { Connector } = require('@toa.io/core')
const { name } = require('./queues')

/**
 * @implements {toa.core.bindings.Consumer}
 */
class Consumer extends Connector {
  /** @type {string} */
  #queue

  /** @type {toa.amqp.Communication} */
  #comm

  /**
   * @param {toa.amqp.Communication} comm
   * @param {toa.core.Locator} locator
   * @param {string} endpoint
   */
  constructor (comm, locator, endpoint) {
    super()

    this.#queue = name(locator, endpoint)
    this.#comm = comm

    this.depends(comm)
  }

  async request (request) {
    return this.#comm.request(this.#queue, request)
  }
}

exports.Consumer = Consumer
