import { Connector } from '@toa.io/core'
import { console } from 'openspan'

import { outbound } from './queues.js'

/**
 * Publishes to a channel, addressed by label. What it is handed is what it publishes: the body
 * is the message and nothing else, no envelope and no header of its own, because a message
 * shape is often somebody else's contract.
 *
 * @implements {import('@toa.io/core/types').bindings.Outbound}
 */
export class Outbound extends Connector {
  /** @type {string} */
  #exchange

  /** @type {toa.amqp.Communication} */
  #comm

  constructor(comm, channel) {
    super()

    this.#exchange = outbound(channel)
    this.#comm = comm

    this.depends(comm)
  }

  async send(label, message) {
    console.debug('Sending AMQP message', { exchange: this.#exchange, label, message })

    await this.#comm.route(this.#exchange, label, message, PROPERTIES)
  }
}

/**
 * `mandatory` so that a label nothing is bound under is returned rather than dropped in
 * silence: `Communication` logs what comes back, and that is the only sign a message had
 * nowhere to go.
 */
const PROPERTIES = { persistent: true, mandatory: true }
