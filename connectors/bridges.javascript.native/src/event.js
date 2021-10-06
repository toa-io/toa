'use strict'

class Event {
  #event

  constructor (event) {
    this.#event = event
  }

  condition = async (...args) => this.#event.condition(...args)
  payload = async (...args) => this.#event.payload(...args)
}

exports.Event = Event
