'use strict'

const { Connector } = require('./connector')

class Receiver extends Connector {
  #conditioned
  #adaptive
  #apply
  #bridge

  constructor (definition, apply, bridge) {
    super()

    this.#conditioned = definition.conditioned
    this.#adaptive = definition.adaptive

    this.#apply = apply
    this.#bridge = bridge

    this.depends(apply)
    this.depends(bridge)
  }

  async receive (payload) {
    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = this.#adaptive ? await this.#bridge.request(payload) : payload

    // TODO: handle exceptions
    this.#apply.apply(request)
  }
}

exports.Receiver = Receiver
