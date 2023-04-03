'use strict'

const { Connector } = require('@toa.io/core')

const { binding } = require('./binding')

/**
 * @implements {toa.core.Connector}
 */
class Receiver extends Connector {
  /** @type {string} */
  #label

  /** @type {toa.core.Receiver} */
  #receiver

  /**
   * @param {toa.core.Locator} locator
   * @param {string} label
   * @param {toa.core.Receiver} receiver
   */
  constructor (label, receiver) {
    super()

    this.#label = label
    this.#receiver = receiver
  }

  async open () {
    await binding.subscribe(this.#label, (message) => this.#receiver.receive(message))
  }
}

exports.Receiver = Receiver
