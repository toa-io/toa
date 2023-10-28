'use strict'

const { Connector } = require('@toa.io/core')
const { validate } = require('./validate')

class Receiver extends Connector {
  /** @type {toa.core.Receiver} */
  #receiver

  /** @type {string} */
  #id

  constructor (receiver, locator) {
    super()

    this.#receiver = receiver
    this.#id = locator.id

    this.depends(receiver)
  }

  async receive (message) {
    if (message.sample === undefined) return this.#receiver.receive(message)
    else return this.#apply(message)
  }

  async #apply (message) {
    validate(message.sample, 'message')

    const { component, request } = message.sample

    if (component === undefined || component === this.#id) {
      message.sample = /** @type {toa.sampling.request.Sample} */ request

      return this.#receiver.receive(message)
    }
  }
}

exports.Receiver = Receiver
