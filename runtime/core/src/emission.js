'use strict'

const { Connector } = require('./connector')

class Emission extends Connector {
  #events

  constructor (events) {
    super()

    this.#events = events
    this.depends(events)
  }

  async emit ({ origin, changeset, state }) {
    const emission = this.#events.map((event) => event.emit(origin, changeset, state))

    await Promise.all(emission)
  }
}

exports.Emission = Emission
