'use strict'

const { Connector } = require('./connector')

class Event extends Connector {
  #bridge

  label
  conditional
  subjective

  constructor (declaration, bridge = undefined) {
    super()

    this.label = declaration.label
    this.conditional = declaration.conditional
    this.subjective = declaration.subjective
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
