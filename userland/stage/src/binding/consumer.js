'use strict'

const { Connector } = require('@toa.io/core')

const { binding } = require('./binding')
const { label } = require('./label')

/**
 * @implements {toa.core.bindings.Consumer}
 */
class Consumer extends Connector {
  /** @type {string} */
  #label

  /**
   * @param {toa.core.Locator} locator
   * @param {string} endpoint
   */
  constructor (locator, endpoint) {
    super()

    this.#label = label(locator, endpoint)
  }

  async request (request) {
    request = JSON.parse(JSON.stringify(request))

    return binding.request(this.#label, request)
  }
}

exports.Consumer = Consumer
