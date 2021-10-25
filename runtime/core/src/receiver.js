'use strict'

const { Connector } = require('./connector')

class Receiver extends Connector {
  #conditioned
  #adaptive
  #transition

  #local
  #bridge

  constructor (definition, local, bridge) {
    super()

    this.#conditioned = definition.conditioned
    this.#adaptive = definition.adaptive
    this.#transition = definition.transition

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    this.depends(bridge)
  }

  async receive (payload) {
    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = this.#adaptive ? await this.#bridge.request(payload) : payload

    console.info('received', payload)
    await this.#local.invoke(this.#transition, request)
  }
}

exports.Receiver = Receiver
