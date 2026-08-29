'use strict'

const { Connector } = require('@toa.io/core')
const { console } = require('openspan')

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

  /** @type {Set<Promise<any>>} */
  #pending = new Set()

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
    if (this.#queue !== undefined)
      await this.#comm.process(this.#queue, this.#receive)
    else
      await this.#comm.consume(this.#exchange, this.#group, this.#receive)
  }

  /**
   * Stops consuming before the receiver it consumes for is taken apart.
   *
   * The receiver is a dependency, and a dependency is disconnected only once this has
   * returned — so what is closed here is closed while the receiver is still whole.
   * Sealing does not recall deliveries already dispatched, hence the wait for those
   * still running.
   */
  async close () {
    await this.#comm.seal()
    await Promise.allSettled(this.#pending)
  }

  /**
   * @param {any} message
   * @param {object} properties
   */
  #receive = async (message, properties) => {
    if (!('toa.io/amqp' in properties.headers)) message = { payload: message }

    console.debug('AMQP event received', { label: this.#exchange ?? this.#queue, message, properties })

    const promise = this.#receiver.receive(message)

    this.#pending.add(promise)

    try {
      await promise
    } finally {
      this.#pending.delete(promise)
    }
  }
}

exports.Receiver = Receiver
