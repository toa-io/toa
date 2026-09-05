import { Connector } from '@toa.io/core'

/**
 * @implements {import('@toa.io/core/types').bridges.Receiver}
 */
export class Receiver extends Connector {
  #receiver

  constructor (receiver) {
    super()

    this.#receiver = receiver
  }

  condition = async (...args) => this.#receiver.condition(...args)
  request = async (...args) => this.#receiver.request(...args)
}
