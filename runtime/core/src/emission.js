'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Emission extends Connector {
  #events
  #bindings
  #promise

  constructor (promise, events) {
    super()

    this.#promise = promise
    this.#events = events

    this.depends(events)
  }

  async connection () {
    this.#bindings = (await this.#promise).filter((binding) => binding.emitter)
  }

  async emit ({ state, origin, changeset }) {
    const emission = []

    for (const event of this.#events) {
      if (event.conditional === false || await event.condition(origin, changeset) === true) {
        const payload = event.subjective ? await event.payload(state) : state

        emission.push(this.#emit(event.label, payload))
      }
    }

    await Promise.all(emission)
  }

  async #emit (label, payload) {
    let success = false
    let i = 0

    while (success === false && i < this.#bindings.length) {
      success = await this.#bindings[i].emit(label, payload)
      i++
    }

    if (success === false) {
      throw new Exception(Exception.EMISSION,
        `Emission '${label}' failed. All (${this.#bindings.length}) bindings rejected.`)
    }
  }
}

exports.Emission = Emission
