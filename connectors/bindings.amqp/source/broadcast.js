import { Connector, deliveries } from '@toa.io/core'

import { name } from './queues.js'

/**
 * @implements {import('@toa.io/core/types').bindings.Broadcast}
 */
export class Broadcast extends Connector {
  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {import('@toa.io/core').Locator} */
  #locator

  /** @type {string} */
  #group

  constructor(comm, locator, group) {
    super()

    this.#comm = comm
    this.#locator = locator
    this.#group = group

    this.depends(comm)
  }

  async transmit(label, payload) {
    const exchange = name(this.#locator, label)

    await this.#comm.emit(exchange, payload, { deliveryMode: 1 })
  }

  /**
   * The callback is counted in while it runs, as every other delivery is. This one holds no
   * `pending` set of its own, because nothing here waits for it: a broadcast is announcements,
   * and what it feeds is taken down by its own teardown rather than by this one.
   */
  async receive(label, callback) {
    const exchange = name(this.#locator, label)

    await this.#comm.consume(exchange, this.#group, async (...args) => {
      deliveries.taken()

      try {
        return await callback(...args)
      } finally {
        deliveries.done()
      }
    })
  }
}
