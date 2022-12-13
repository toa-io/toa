'use strict'

const { Connector } = require('./connector')

/**
 * @implements {toa.core.Receiver}
 */
class Receiver extends Connector {
  #conditioned
  #adaptive
  #transition

  #local
  #bridge

  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, transition } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#transition = transition

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    this.depends(bridge)
  }

  async receive (message) {
    const payload = message.payload

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = this.#adaptive ? await this.#bridge.request(payload) : payload

    await this.#local.invoke(this.#transition, request)
  }
}

exports.Receiver = Receiver
