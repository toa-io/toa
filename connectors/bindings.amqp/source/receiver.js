'use strict'

const { Connector } = require('@toa.io/core')
const { name } = require('./queues')

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
   * @param {toa.core.Locator} locator
   * @param {string} label
   * @param {string} group
   * @param {toa.core.Receiver} receiver
   */
  constructor (comm, locator, label, group, receiver) {
    super()

    this.#exchange = name(locator, label)
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
