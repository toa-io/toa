'use strict'

const { Connector } = require('./connector')

class Event extends Connector {
  #bridge

  label
  conditioned
  subjective

  constructor (label, definition, bridge = undefined) {
    super()

    this.label = label
    this.conditioned = definition.conditioned
    this.subjective = definition.subjective

    this.#bridge = bridge

    if (bridge !== undefined) this.depends(bridge)
  }

  async condition (...args) {
    if (this.#bridge !== undefined) return this.#bridge.condition(...args)
    else return true
  }

  async payload (state) {
    if (this.#bridge !== undefined) return this.#bridge.payload(state)
    else return state
  }
}

exports.Event = Event
