import { Connector } from '@toa.io/core'
import { console } from 'openspan'

import { name } from './queues.js'

/**
 * @implements {import('@toa.io/core/types').bindings.Emitter}
 */
export class Emitter extends Connector {
  /** @type {string} */
  #exchange

  /** @type {toa.amqp.Communication} */
  #comm

  constructor (comm, locator, label) {
    super()

    this.#exchange = name(locator, label)
    this.#comm = comm

    this.depends(comm)
  }

  async emit (message) {
    console.debug('Emitting AMQP event', { exchange: this.#exchange, message })

    await this.#comm.emit(this.#exchange, message, PROPERTIES)
  }
}

const PROPERTIES = { headers: { 'toa.io/amqp': '0' } }
