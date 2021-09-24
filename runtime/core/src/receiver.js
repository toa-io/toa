'use strict'

class Receiver {
  #conditioned
  #adaptive
  #bridge
  #call

  constructor (definition, call, bridge) {
    this.#bridge = bridge
    this.#call = call

    this.#conditioned = definition.conditioned
    this.#adaptive = definition.adaptive

    this.depends(bridge)
    this.depends(call)
  }

  async receive (payload) {
    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = this.#adaptive ? this.#bridge.request(payload) : payload

    await this.#call.invoke(request)
  }
}

exports.Receiver = Receiver
