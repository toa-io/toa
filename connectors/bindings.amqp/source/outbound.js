import { Connector } from '@toa.io/core'
import { console } from 'openspan'

import { outbound, scoped } from './queues.js'

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

  /**
   * Declares a durable `queue` bound to the channel under `label`, so that what is sent under it
   * before anything consumes the queue is held there rather than returned. Whatever consumes it
   * may be something other than Toa, and the queue is the producer's for that reason.
   *
   * With `dead`, what the queue's consumer rejects is routed back to the channel under that label
   * instead of being dropped, where a queue retained under it keeps it.
   *
   * @param {string} queue
   * @param {string} label
   * @param {string} [dead]
   */
  async retain(queue, label, dead) {
    const args =
      dead === undefined
        ? undefined
        : { 'x-dead-letter-exchange': this.#exchange, 'x-dead-letter-routing-key': dead }

    await this.#comm.retain(this.#exchange, scoped(queue), label, args)
  }
}

/**
 * `mandatory` so that a label nothing is bound under is returned rather than dropped in
 * silence: `Communication` logs what comes back, and that is the only sign a message had
 * nowhere to go.
 */
const PROPERTIES = { persistent: true, mandatory: true }
