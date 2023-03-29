'use strict'

const { Connector } = require('@toa.io/core')

class Receiver extends Connector {
  /** @type {string} */
  #exchange

  /** @type {string} */
  #group

  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {toa.core.Receiver} */
  #receiver

  /**
   * @param {toa.amqp.Communication} comm
   * @param {string} exchange
   * @param {string} group
   * @param {toa.core.Receiver} receiver
   */
  constructor (comm, exchange, group, receiver) {
    super()

    this.#exchange = exchange
    this.#group = group
    this.#comm = comm
    this.#receiver = receiver

    this.depends(comm)
  }

  async open () {
    await this.#comm.consume(this.#exchange, this.#group, (message) => this.#receiver.receive(message))
  }
}

exports.Receiver = Receiver
