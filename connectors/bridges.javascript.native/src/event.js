'use strict'

const load = require('./load')

class Event {
  #event

  constructor (declaration) {
    this.#event = load.event(declaration.path, declaration.label)
  }

  condition = async (...args) => this.#event.condition(...args)
  payload = async (...args) => this.#event.payload(...args)
}

exports.Event = Event
