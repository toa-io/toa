'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.sampling.Receiver}
 */
class Receiver extends Connector {
  /** @type {toa.core.Receiver} */
  #receiver

  /** @type {string} */
  #id

  /**
   * @param {toa.core.Receiver} receiver
   * @param {toa.core.Locator} locator
   */
  constructor (receiver, locator) {
    super()

    this.#receiver = receiver
    this.#id = locator.id

    this.depends(receiver)
  }

  /**
   * @param {toa.sampling.Message} message
   */
  async receive (message) {
    if (message.sample === undefined) return this.#receiver.receive(message)
    else return this.#apply(message)
  }

  async #apply (message) {
    // validation
    const { component, request } = message.sample

    if (component === undefined || component === this.#id) {
      message.sample = /** @type {toa.sampling.request.Sample} */ request

      return this.#receiver.receive(message)
    }
  }
}

exports.Receiver = Receiver
