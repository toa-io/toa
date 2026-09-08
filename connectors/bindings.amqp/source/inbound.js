import { Connector } from '@toa.io/core'
import { console } from 'openspan'

import { bound, inbound } from './queues.js'

/**
 * Consumes what arrives on a channel under one label. The queue is named and durable, so what
 * is published while nothing consumes is held rather than dropped.
 */
export class Inbound extends Connector {
  /** @type {string} */
  #exchange

  /** @type {string} */
  #queue

  /** @type {string} */
  #label

  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {import('@toa.io/core/types').bindings.Inbound} */
  #sink

  /** @type {Set<Promise<any>>} */
  #pending = new Set()

  // eslint-disable-next-line max-params
  constructor(comm, channel, label, sink) {
    super()

    this.#exchange = inbound(channel)
    this.#queue = bound(channel, label)
    this.#label = label
    this.#comm = comm
    this.#sink = sink

    this.depends(comm)
  }

  async open() {
    await this.#comm.subscribe(this.#exchange, this.#queue, this.#label, this.#receive)
  }

  /**
   * Stops consuming before whatever it hands messages to is taken apart. Sealing does not
   * recall deliveries already dispatched, hence the wait for those still running.
   */
  async close() {
    await this.#comm.seal()
    await Promise.allSettled(this.#pending)
  }

  #receive = async (message) => {
    console.debug('AMQP message received', { queue: this.#queue, message })

    const promise = this.#sink.accept(message)

    this.#pending.add(promise)

    try {
      await promise
    } finally {
      this.#pending.delete(promise)
    }
  }
}
