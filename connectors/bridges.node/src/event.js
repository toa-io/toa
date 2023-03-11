'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.bridges.Event}
 */
class Event extends Connector {
  #event

  constructor (event) {
    super()

    this.#event = event
  }

  condition = async (...args) => this.#event.condition(...args)
  payload = async (...args) => this.#event.payload(...args)
}

exports.Event = Event
