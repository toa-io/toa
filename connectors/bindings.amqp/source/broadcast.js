import { Connector } from '@toa.io/core'

import { name } from './queues.js'

/**
 * @implements {toa.core.bindings.Broadcast}
 */
class Broadcast extends Connector {
  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {toa.core.Locator} */
  #locator

  /** @type {string} */
  #group

  constructor (comm, locator, group) {
    super()

    this.#comm = comm
    this.#locator = locator
    this.#group = group

    this.depends(comm)
  }

  async transmit (label, payload) {
    const exchange = name(this.#locator, label)

    await this.#comm.emit(exchange, payload, { deliveryMode: 1 })
  }

  async receive (label, callback) {
    const exchange = name(this.#locator, label)

    await this.#comm.consume(exchange, this.#group, callback)
  }
}

export { Broadcast }
