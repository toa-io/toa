'use strict'

const { Connector } = require('./connector')

/**
 * @implements {toa.core.Receiver}
 */
class Receiver extends Connector {
  /** @type {boolean} */ #conditioned
  /** @type {boolean} */ #adaptive
  /** @type {string} */ #endpoint

  /** @type {toa.core.Component} */ #local
  /** @type {toa.core.bridges.Event} */ #bridge

  /**
   *
   * @param {toa.norm.component.Receiver} definition
   * @param {toa.core.Component} local
   * @param {toa.core.bridges.Event} bridge
   */
  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, transition } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#endpoint = transition

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    this.depends(bridge)
  }

  /** @hot */
  async receive (message) {
    const domestic = typeof message.payload === 'object'
    const payload = domestic ? message.payload : message

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = this.#adaptive ? await this.#bridge.request(payload) : payload

    await this.#local.invoke(this.#endpoint, request)
  }
}

exports.Receiver = Receiver
