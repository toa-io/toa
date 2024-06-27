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

  constructor (comm, exchange, group, receiver) {
    super()

    this.#exchange = exchange
    this.#group = group
    this.#comm = comm
    this.#receiver = receiver

    this.depends(comm)
    this.depends(receiver)
  }

  async open () {
    await this.#comm.consume(this.#exchange, this.#group, this.#receive)
  }

  /**
   * @param {any} message
   * @param {object} properties
   */
  #receive = async (message, properties) => {
    if (!('toa.io/amqp' in properties.headers)) message = { payload: message }

    await this.#receiver.receive(message)
  }
}

exports.Receiver = Receiver
