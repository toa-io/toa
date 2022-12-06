'use strict'

const { Connector } = require('./connector')

class Event extends Connector {
  #emitter
  #bridge
  #conditioned
  #subjective

  constructor (definition, emitter, bridge = undefined) {
    super()

    this.#conditioned = definition.conditioned
    this.#subjective = definition.subjective
    this.#emitter = emitter
    this.#bridge = bridge

    this.depends(emitter)

    if (bridge !== undefined) this.depends(bridge)
  }

  async emit (event) {
    if (this.#conditioned === false || await this.#bridge.condition(event) === true) {
      const payload = this.#subjective ? await this.#bridge.payload(event) : event.state

      await this.#emitter.emit(payload)
    }
  }
}

exports.Event = Event
