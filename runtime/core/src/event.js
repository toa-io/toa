'use strict'

const { Connector } = require('./connector')

class Event extends Connector {
  #binding
  #bridge
  #conditioned
  #subjective

  constructor (definition, binding, bridge = undefined) {
    super()

    this.#conditioned = definition.conditioned
    this.#subjective = definition.subjective
    this.#binding = binding
    this.#bridge = bridge

    this.depends(binding)

    if (bridge !== undefined) this.depends(bridge)
  }

  async emit (event) {
    if (this.#conditioned === false || await this.#bridge.condition(event) === true) {
      const payload = this.#subjective ? await this.#bridge.payload(event) : event.state

      await this.#binding.emit(payload)
    }
  }
}

exports.Event = Event
