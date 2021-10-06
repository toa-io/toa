'use strict'

class Receiver {
  #receiver

  constructor (receiver) {
    this.#receiver = receiver
  }

  condition = async (...args) => this.#receiver.condition(...args)
  request = async (...args) => this.#receiver.request(...args)
}

exports.Receiver = Receiver
