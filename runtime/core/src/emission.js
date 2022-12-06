'use strict'

const { Connector } = require('./connector')

class Emission extends Connector {
  #events

  constructor (events) {
    super()

    this.#events = events

    this.depends(events)
  }

  async emit (event) {
    const emission = this.#events.map((emitter) => emitter.emit(event))

    await Promise.all(emission)
  }
}

exports.Emission = Emission
