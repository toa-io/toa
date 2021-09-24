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

  async emit (origin, changeset, state) {
    if (await this.#condition(origin, changeset) === true) {
      const payload = await this.#payload(state)
      await this.#binding.emit(payload)
    }
  }

  #condition = async (...args) => this.#conditioned ? this.#bridge.condition(...args) : true
  #payload = async (state) => this.#subjective ? this.#bridge.payload(state) : state
}

exports.Event = Event
