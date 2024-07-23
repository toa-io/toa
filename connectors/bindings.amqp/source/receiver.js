'use strict'

const { Connector } = require('@toa.io/core')

class Receiver extends Connector {
  /** @type {string | undefined} */
  #exchange

  /** @type {string | undefined} */
  #queue

  /** @type {string} */
  #group

  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {toa.core.Receiver} */
  #receiver

  constructor (comm, label, group, receiver) {
    super()

    const [name, type] = label.split(':').reverse()

    if (type === 'queue') this.#queue = name
    else this.#exchange = name

    this.#group = group
    this.#comm = comm
    this.#receiver = receiver

    this.depends(comm)
    this.depends(receiver)
  }

  async open () {
    if (this.#queue !== null)
      await this.#comm.process(this.#queue, this.#receive)
    else
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
