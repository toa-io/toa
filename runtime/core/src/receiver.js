'use strict'

const { add } = require('@toa.io/generic')
const { Connector } = require('./connector')

/**
 * @implements {toa.core.Receiver}
 */
class Receiver extends Connector {
  /** @type {boolean} */
  #conditioned

  /** @type {boolean} */
  #adaptive

  /** @type {string} */
  #endpoint

  /** @type {toa.core.Component} */
  #local

  /** @type {toa.core.bridges.Event} */
  #bridge

  /** @type {boolean} */
  #foreign

  /**
   *
   * @param {toa.norm.component.Receiver} definition
   * @param {toa.core.Component} local
   * @param {toa.core.bridges.Event} bridge
   */
  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, transition, foreign } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#endpoint = transition

    this.#local = local
    this.#bridge = bridge
    this.#foreign = foreign

    this.depends(local)
    this.depends(bridge)
  }

  /** @hot */
  async receive (message) {
    const { payload, extensions } = this.#parse(message)

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = await this.#request(payload)

    if (extensions) add(request, extensions)

    await this.#local.invoke(this.#endpoint, request)
  }

  async #request (payload) {
    return this.#adaptive ? await this.#bridge.request(payload) : payload
  }

  /**
   * @param message
   * @return {{extensions: (Pick<*, Exclude<keyof *, "payload">>|*[]), payload: *}}
   */
  #parse (message) {
    const { payload, ...extensions } = message
    return {
      payload: this.#foreign ? message : payload,
      extensions: this.#foreign ? [] : extensions
    }
  }
}

exports.Receiver = Receiver
