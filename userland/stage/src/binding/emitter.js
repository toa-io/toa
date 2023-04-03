'use strict'

const { Connector } = require('@toa.io/core')

const { binding } = require('./binding')
const { label } = require('./label')

/**
 * @implements {toa.core.bindings.Emitter}
 */
class Emitter extends Connector {
  /** @type {string} */
  #label

  constructor (locator, endpoint) {
    super()

    this.#label = label(locator, endpoint)
  }

  async emit (message) {
    await binding.emit(this.#label, message)
  }
}

exports.Emitter = Emitter
