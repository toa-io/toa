'use strict'

const { Connector } = require('@kookaburra/core')
const load = require('./load')

class Event extends Connector {
  #event

  constructor (root, label) {
    super()
    this.#event = load.event(root, label)
  }

  condition = async (...args) => this.#event.condition(...args)
  payload = async (...args) => this.#event.payload(...args)
}

exports.Event = Event
