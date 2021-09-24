'use strict'

const { Connector } = require('./connector')

class Emission extends Connector {
  #events
  #binding

  constructor (binding, events) {
    super()

    this.#binding = binding
    this.#events = events

    this.depends(binding)
    this.depends(events)
  }

  async emit ({ state, origin, changeset }) {
    const emission = []

    for (const event of this.#events) {
      if (event.conditioned === false || await event.condition(origin, changeset) === true) {
        const payload = event.subjective ? await event.payload(state) : state

        emission.push(this.#binding.emit(event.label, payload))
      }
    }

    await Promise.all(emission)
  }
}

exports.Emission = Emission
