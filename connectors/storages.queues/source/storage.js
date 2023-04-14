'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.Storage}
 */
class Storage extends Connector {
  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {string} */
  #exchange

  /**
   * @param {toa.amqp.Communication} comm
   * @param {toa.queues.Properties} properties
   */
  constructor (comm, properties) {
    super()

    this.#comm = comm
    this.#exchange = properties.exchange

    this.depends(comm)
  }

  async store (payload) {
    await this.#comm.emit(this.#exchange, payload)

    return true
  }
}

exports.Storage = Storage
