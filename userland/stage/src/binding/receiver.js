'use strict'

const { Connector } = require('@toa.io/core')

const { binding } = require('./binding')
const { label } = require('./label')

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
   * @param {string} endpoint
   * @param {toa.core.Receiver} receiver
   */
  constructor (locator, endpoint, receiver) {
    super()

    this.#label = label(locator, endpoint)
    this.#receiver = receiver
  }

  async connection () {
    await binding.subscribe(this.#label, (message) => this.#receiver.receive(message))
  }
}

exports.Receiver = Receiver
