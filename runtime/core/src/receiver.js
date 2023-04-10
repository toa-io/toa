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

  /** @type {boolean} */
  #foreign

  /** @type {string} */
  #endpoint

  /** @type {toa.core.Component} */
  #local

  /** @type {toa.core.bridges.Event} */
  #bridge

  /**
   *
   * @param {toa.norm.component.Receiver} definition
   * @param {toa.core.Component} local
   * @param {toa.core.bridges.Event} bridge
   */
  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, foreign, transition } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#foreign = foreign
    this.#endpoint = transition

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    this.depends(bridge)
  }

  /** @hot */
  async receive (message) {
    const { payload, extensions } = this.#parse(message)

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = await this.#request(payload)

    if (extensions !== undefined) add(request, extensions)

    await this.#local.invoke(this.#endpoint, request)
  }

  async #request (payload) {
    return this.#adaptive ? await this.#bridge.request(payload) : payload
  }

  /**
   * @param {toa.core.Message | any} message
   * @return {{payload: any, extensions: object | undefined}}
   */
  #parse (message) {
    if (this.#foreign) {
      return {
        payload: message,
        extensions: undefined
      }
    }

    const { payload, ...extensions } = message

    return { payload, extensions }
  }
}

exports.Receiver = Receiver
